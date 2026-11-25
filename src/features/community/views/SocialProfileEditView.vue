<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isCancel } from 'axios'
import { useDebounceFn } from '@vueuse/core'
import { ArrowLeft, AtSign, Camera, Check, CirclePlus, Contact, Loader2, MapPin, Save, Trash2, X, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useSocialProfileStore } from '@/stores/social-profile.store'
import { toApiError } from '@/lib/api/types/api-error'
import { socialProfileService } from '../services/social-profile.service'
import {
  BIOGRAFIA_MAX,
  LOCALIZACAO_MAX,
  NOME_EXIBICAO_MAX,
  USERNAME_SOCIAL_MAX,
  normalizeUsername,
  usernameSocialSchema,
  validateProfilePhoto,
  validateSocialProfile,
  type SocialProfileErrors,
  type SocialProfileField,
} from '../schemas/social-profile.schemas'
import type { Badge, PerfilSocialPayload, UsernameStatus } from '../types/community.types'
import BadgeIcon from '../components/BadgeIcon.vue'
import BadgePickerDialog from '../components/BadgePickerDialog.vue'
import { ui } from '../ui'

const MAX_FEATURED_BADGES = 3

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useSocialProfileStore()

/* --------------------------------- Estado --------------------------------- */

const loadStatus = ref<'loading' | 'ready' | 'error'>('loading')
const loadError = ref('')
/** Fixado após o carregamento: criar (primeira vez) ou editar. */
const mode = ref<'create' | 'edit'>('create')

const form = reactive<Record<SocialProfileField, string>>({
  nome_exibicao: '',
  username_social: '',
  biografia_social: '',
  localizacao_estado: '',
})
const initial = reactive<Record<SocialProfileField, string>>({ ...form })

const fieldErrors = ref<SocialProfileErrors>({})
const formError = ref('')
const successMessage = ref('')
const submitting = ref(false)

const idUsuario = computed(() => Number(auth.usuario?.id))
const isCreate = computed(() => mode.value === 'create')
const pageTitle = computed(() => (isCreate.value ? 'Criar Perfil Social' : 'Editar Perfil Social'))
const bottomButtonLabel = computed(() => (isCreate.value ? 'Confirmar' : 'Salvar Alterações'))

function goBack(): void {
  const back = window.history.state?.back
  if (typeof back === 'string' && back.split('?')[0] === '/comunidade/perfil') {
    void router.back()
    return
  }

  void router.replace({ name: 'community-profile' })
}

/** Destino após criar o perfil (ignora redirects que saiam do app). */
const redirectTo = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : null
})

/* ---------------------------------- Foto ---------------------------------- */

const photoInput = ref<HTMLInputElement | null>(null)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const removePhoto = ref(false)
const photoError = ref('')

const currentPhoto = computed(() => {
  if (removePhoto.value) return null
  return photoPreview.value ?? store.perfil?.foto_perfil ?? null
})

function revokePreview(): void {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = null
}

function onPhotoSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permite escolher o mesmo arquivo de novo
  if (!file) return

  const problem = validateProfilePhoto(file)
  if (problem) {
    photoError.value = problem
    return
  }

  photoError.value = ''
  revokePreview()
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
  removePhoto.value = false
}

function onRemovePhoto(): void {
  photoError.value = ''
  revokePreview()
  photoFile.value = null
  removePhoto.value = true
}

/* --------------------------------- Badges --------------------------------- */

const badges = ref<Badge[]>([])
const featuredIds = ref<number[]>([])
const initialFeaturedIds = ref<number[]>([])
const pickerOpen = ref(false)

const featuredBadges = computed(() =>
  featuredIds.value
    .map((id) => badges.value.find((badge) => badge.id === id))
    .filter((badge): badge is Badge => Boolean(badge)),
)

const badgesDirty = computed(() => {
  const a = [...featuredIds.value].sort()
  const b = [...initialFeaturedIds.value].sort()
  return a.length !== b.length || a.some((id, index) => id !== b[index])
})

/** No primeiro acesso a seção só aparece se o usuário já tiver badges. */
const showBadgesSection = computed(() => !isCreate.value || badges.value.length > 0)

function removeFeatured(id: number): void {
  featuredIds.value = featuredIds.value.filter((current) => current !== id)
}

function applyFeatured(ids: number[]): void {
  featuredIds.value = ids.slice(0, MAX_FEATURED_BADGES)
}

/* ---------------------------- Nome de usuário ---------------------------- */

const usernameStatus = ref<UsernameStatus>('idle')
let usernameAbort: AbortController | null = null

const runUsernameCheck = useDebounceFn(async (username: string) => {
  usernameAbort?.abort()
  usernameAbort = new AbortController()

  try {
    const available = await socialProfileService.checkUsernameAvailability(
      username,
      idUsuario.value,
      usernameAbort.signal,
    )
    // Ignora resposta de um valor que o usuário já mudou.
    if (normalizeUsername(form.username_social) !== username) return
    usernameStatus.value = available ? 'available' : 'taken'
  } catch (error) {
    if (isCancel(error)) return
    if (normalizeUsername(form.username_social) === username) usernameStatus.value = 'error'
  }
}, 500)

watch(
  () => form.username_social,
  (value) => {
    usernameAbort?.abort()
    const username = normalizeUsername(value)

    if (!username) {
      usernameStatus.value = 'idle'
      return
    }
    if (username === initial.username_social) {
      usernameStatus.value = 'available'
      return
    }
    if (!usernameSocialSchema.safeParse(username).success) {
      usernameStatus.value = 'invalid'
      return
    }

    usernameStatus.value = 'checking'
    void runUsernameCheck(username)
  },
)

const usernameLabel = computed(() => {
  switch (usernameStatus.value) {
    case 'checking':
      return { text: 'Verificando…', tone: 'text-neutral-400' }
    case 'available':
      return { text: 'Disponível', tone: 'text-indigo-600' }
    case 'taken':
      return { text: 'Indisponível', tone: 'text-destructive' }
    case 'invalid':
      return { text: 'Formato inválido', tone: 'text-destructive' }
    default:
      return null
  }
})

/* ------------------------------- Carregamento ------------------------------ */

async function bootstrap(): Promise<void> {
  loadStatus.value = 'loading'
  loadError.value = ''

  try {
    await store.load(idUsuario.value, { force: true })
    const perfil = store.getPerfil()

    mode.value = store.hasSocialProfile() ? 'edit' : 'create'

    initial.nome_exibicao = perfil.nome_exibicao ?? ''
    initial.username_social = perfil.username_social ?? ''
    initial.biografia_social = perfil.biografia_social ?? ''
    initial.localizacao_estado = perfil.localizacao_estado ?? ''
    Object.assign(form, initial)

    try {
      badges.value = await socialProfileService.listBadges(idUsuario.value)
    } catch {
      badges.value = [] // badges são opcionais: a falha não bloqueia o perfil
    }
    const destacadas = badges.value.filter((badge) => Boolean(badge.destaque)).map((badge) => badge.id)
    featuredIds.value = destacadas.slice(0, MAX_FEATURED_BADGES)
    initialFeaturedIds.value = [...featuredIds.value]

    usernameStatus.value = initial.username_social ? 'available' : 'idle'
    loadStatus.value = 'ready'
  } catch (error) {
    loadError.value = toApiError(error).mensagem
    loadStatus.value = 'error'
  }
}

onMounted(bootstrap)

onBeforeUnmount(() => {
  usernameAbort?.abort()
  revokePreview()
})

/* --------------------------------- Envio --------------------------------- */

const fieldsDirty = computed(() =>
  (Object.keys(initial) as SocialProfileField[]).some((field) => form[field].trim() !== initial[field]),
)
const dirty = computed(
  () => fieldsDirty.value || Boolean(photoFile.value) || removePhoto.value || badgesDirty.value,
)
const canSubmit = computed(() => !submitting.value && (isCreate.value || dirty.value))

function focusField(field: SocialProfileField): void {
  document.getElementById(`field-${field}`)?.focus()
}

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) return

  formError.value = ''
  successMessage.value = ''

  const result = validateSocialProfile(form)
  fieldErrors.value = result.ok ? {} : result.errors

  if (!result.ok) {
    const first = (Object.keys(result.errors) as SocialProfileField[])[0]
    if (first) focusField(first)
    return
  }

  if (usernameStatus.value === 'checking') {
    formError.value = 'Aguarde a verificação do nome de usuário.'
    return
  }
  if (usernameStatus.value === 'taken') {
    fieldErrors.value = { username_social: 'Este nome de usuário já está em uso.' }
    focusField('username_social')
    return
  }

  submitting.value = true

  try {
    const values = result.data
    const payload: PerfilSocialPayload = {}

    // No primeiro acesso vão todos os campos; depois, só o que mudou.
    ;(Object.keys(values) as SocialProfileField[]).forEach((field) => {
      if (isCreate.value || values[field] !== initial[field]) payload[field] = values[field]
    })

    // Foto: o próprio endpoint grava/limpa `foto_perfil`; o PATCH leva só os campos de texto.
    if (photoFile.value) {
      await socialProfileService.uploadPhoto(idUsuario.value, photoFile.value)
    } else if (removePhoto.value) {
      await socialProfileService.removePhoto(idUsuario.value)
    }

    if (Object.keys(payload).length > 0) {
      await socialProfileService.updateProfile(idUsuario.value, payload)
    }

    let badgesFailed = false
    if (badgesDirty.value) {
      try {
        await socialProfileService.setFeaturedBadges(idUsuario.value, featuredIds.value)
        initialFeaturedIds.value = [...featuredIds.value]
      } catch {
        badgesFailed = true
      }
    }

    await store.load(idUsuario.value, { force: true }) // traz a nova foto_perfil

    if (isCreate.value) {
      await router.replace(redirectTo.value ?? { name: 'community' })
      return
    }

    // Edição: o que acabou de ser salvo vira o novo ponto de comparação.
    Object.assign(initial, {
      nome_exibicao: values.nome_exibicao,
      username_social: values.username_social,
      biografia_social: values.biografia_social,
      localizacao_estado: values.localizacao_estado,
    })
    Object.assign(form, initial)
    revokePreview()
    photoFile.value = null
    removePhoto.value = false

    if (badgesFailed) {
      formError.value = 'Perfil salvo, mas não foi possível atualizar as badges em destaque. Tente novamente.'
    } else {
      successMessage.value = 'Perfil atualizado.'
    }
  } catch (error) {
    const apiError = toApiError(error)
    const campos = (apiError.campos ?? {}) as Partial<Record<string, string>>
    const mapped: SocialProfileErrors = {}

    ;(Object.keys(form) as SocialProfileField[]).forEach((field) => {
      const message = campos[field]
      if (message) mapped[field] = message
    })

    if (apiError.codigo === 'USERNAME_SOCIAL_EM_USO') {
      mapped.username_social = apiError.mensagem
      usernameStatus.value = 'taken'
    }

    fieldErrors.value = mapped
    formError.value = Object.keys(mapped).length > 0 ? 'Corrija os campos destacados.' : apiError.mensagem
  } finally {
    submitting.value = false
  }
}

/* -------------------------------- Estilos -------------------------------- */

const pillButton = ui.btnBlack
const fieldBox = `flex items-center gap-3 px-4 text-sm ${ui.field}`
const fieldInput = 'h-12 w-full min-w-0 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400'
</script>

<template>
  <div :class="ui.page">
  <section class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
    <button
      type="button"
      aria-label="Voltar para a página anterior"
      class="mb-3 rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
      @click="goBack"
    >
      <ArrowLeft class="size-5" aria-hidden="true" />
    </button>
    <header class="flex items-end justify-between gap-4">
      <div>
        <p :class="ui.eyebrow">Comunidade Fimap</p>
        <h1 class="text-xl font-semibold text-neutral-900">{{ pageTitle }}</h1>
      </div>
    </header>

    <!-- Carregando -->
    <div v-if="loadStatus === 'loading'" class="mt-6 grid animate-pulse gap-6 lg:grid-cols-[5fr_8fr]" aria-busy="true">
      <div :class="[ui.card, 'h-56']" />
      <div class="space-y-4">
        <div :class="[ui.card, 'h-14']" />
        <div :class="[ui.card, 'h-36']" />
        <div :class="[ui.card, 'h-14 w-2/3']" />
      </div>
    </div>

    <!-- Erro ao carregar -->
    <div v-else-if="loadStatus === 'error'" role="alert" :class="[ui.card, 'mt-6 p-6 text-center']">
      <p class="text-sm font-medium text-neutral-900">Não foi possível carregar seu perfil.</p>
      <p class="mt-1 text-sm text-neutral-500">{{ loadError }}</p>
      <button type="button" :class="[pillButton, 'mt-4']" @click="bootstrap">Tentar novamente</button>
    </div>

    <!-- Formulário -->
    <form v-else id="social-profile-form" class="mt-6 space-y-6" novalidate @submit.prevent="onSubmit">
      <div
        v-if="formError"
        role="alert"
        class="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <AlertCircle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {{ formError }}
      </div>
      <div
        v-if="successMessage"
        role="status"
        class="flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white"
      >
        <Check class="size-4 shrink-0" aria-hidden="true" />
        {{ successMessage }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[5fr_8fr]">
        <!-- Foto -->
        <div :class="[ui.card, 'flex flex-col items-center justify-center gap-3 p-8 lg:self-start']">
          <div class="relative">
            <!-- Sem foto: ícone de câmera centralizado. Com foto: ela ocupa o círculo inteiro,
                 recortada e redimensionada (object-cover) para o mesmo tamanho padrão. -->
            <button
              type="button"
              aria-label="Alterar foto de perfil"
              class="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[#ebebeb] outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 sm:size-28"
              @click="photoInput?.click()"
            >
              <img
                v-if="currentPhoto"
                :src="currentPhoto"
                alt="Foto de perfil"
                class="size-full object-cover"
                decoding="async"
                referrerpolicy="no-referrer"
              />
              <Camera v-else class="size-8 text-neutral-500" aria-hidden="true" />
            </button>

            <!-- Selo de câmera preto no canto, como na referência (só quando já há foto) -->
            <button
              v-if="currentPhoto"
              type="button"
              aria-label="Trocar foto de perfil"
              class="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-black text-white outline-none transition hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
              @click="photoInput?.click()"
            >
              <Camera class="size-4" aria-hidden="true" />
            </button>

            <input
              ref="photoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="onPhotoSelected"
            />
          </div>

          <button
            v-if="currentPhoto"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            @click="onRemovePhoto"
          >
            <Trash2 class="size-3.5" aria-hidden="true" />
            Remover foto
          </button>
          <p v-else class="text-center text-xs text-neutral-400">JPG, PNG ou WebP até 5 MB</p>
          <p v-if="photoError" role="alert" class="text-center text-xs text-red-600">{{ photoError }}</p>
        </div>

        <!-- Campos -->
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-[3fr_2fr]">
            <div>
              <div class="mb-1.5 flex items-baseline justify-between">
                <label for="field-nome_exibicao" class="text-sm font-medium text-neutral-900">Nome de Exibição</label>
                <span class="text-xs text-neutral-400">{{ form.nome_exibicao.length }}/{{ NOME_EXIBICAO_MAX }}</span>
              </div>
              <div :class="fieldBox">
                <Contact class="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                <input
                  id="field-nome_exibicao"
                  v-model="form.nome_exibicao"
                  type="text"
                  autocomplete="name"
                  :maxlength="NOME_EXIBICAO_MAX"
                  placeholder="Como você quer aparecer na comunidade"
                  :class="fieldInput"
                  :aria-invalid="Boolean(fieldErrors.nome_exibicao)"
                  :aria-describedby="fieldErrors.nome_exibicao ? 'error-nome_exibicao' : undefined"
                />
              </div>
              <p v-if="fieldErrors.nome_exibicao" id="error-nome_exibicao" role="alert" class="mt-1.5 text-xs text-red-600">
                {{ fieldErrors.nome_exibicao }}
              </p>
            </div>

            <div>
              <div class="mb-1.5 flex items-baseline justify-between">
                <label for="field-username_social" class="text-sm font-medium text-neutral-900">Nome de Usuário</label>
                <span v-if="usernameLabel" class="text-xs font-medium" :class="usernameLabel.tone" aria-live="polite">
                  {{ usernameLabel.text }}
                </span>
              </div>
              <div :class="fieldBox">
                <AtSign class="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                <input
                  id="field-username_social"
                  v-model="form.username_social"
                  type="text"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  :maxlength="USERNAME_SOCIAL_MAX + 1"
                  placeholder="seu.usuario"
                  :class="fieldInput"
                  :aria-invalid="Boolean(fieldErrors.username_social) || usernameStatus === 'taken'"
                  :aria-describedby="fieldErrors.username_social ? 'error-username_social' : undefined"
                />
                <span
                  v-if="usernameStatus === 'available'"
                  class="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                  aria-hidden="true"
                >
                  <Check class="size-3" />
                </span>
                <Loader2 v-else-if="usernameStatus === 'checking'" class="size-4 shrink-0 animate-spin text-neutral-400" aria-hidden="true" />
              </div>
              <p v-if="fieldErrors.username_social" id="error-username_social" role="alert" class="mt-1.5 text-xs text-red-600">
                {{ fieldErrors.username_social }}
              </p>
            </div>
          </div>

          <div>
            <div class="mb-1.5 flex items-baseline justify-between">
              <label for="field-biografia_social" class="text-sm font-medium text-neutral-900">Biografia Social</label>
              <span class="text-xs text-neutral-400">{{ form.biografia_social.length }}/{{ BIOGRAFIA_MAX }} caracteres</span>
            </div>
            <textarea
              id="field-biografia_social"
              v-model="form.biografia_social"
              rows="5"
              :maxlength="BIOGRAFIA_MAX"
              placeholder="Conte um pouco sobre você e seus objetivos financeiros"
              :class="[ui.field, 'w-full resize-none px-4 py-3.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400']"
              :aria-invalid="Boolean(fieldErrors.biografia_social)"
              :aria-describedby="fieldErrors.biografia_social ? 'error-biografia_social' : undefined"
            />
            <p v-if="fieldErrors.biografia_social" id="error-biografia_social" role="alert" class="mt-1.5 text-xs text-red-600">
              {{ fieldErrors.biografia_social }}
            </p>
          </div>

          <div class="sm:w-2/3">
            <label for="field-localizacao_estado" class="mb-1.5 block text-sm font-medium text-neutral-900">
              Localização / Estado
            </label>
            <div :class="fieldBox">
              <MapPin class="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
              <input
                id="field-localizacao_estado"
                v-model="form.localizacao_estado"
                type="text"
                autocomplete="address-level1"
                :maxlength="LOCALIZACAO_MAX"
                placeholder="Cidade, UF"
                :class="fieldInput"
                :aria-invalid="Boolean(fieldErrors.localizacao_estado)"
                :aria-describedby="fieldErrors.localizacao_estado ? 'error-localizacao_estado' : undefined"
              />
            </div>
            <p v-if="fieldErrors.localizacao_estado" id="error-localizacao_estado" role="alert" class="mt-1.5 text-xs text-red-600">
              {{ fieldErrors.localizacao_estado }}
            </p>
          </div>
        </div>
      </div>

      <!-- Badges em destaque -->
      <div v-if="showBadgesSection" :class="[ui.card, 'p-5']">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-sm font-medium text-neutral-900">Badges em Destaque no Perfil</h2>
            <p class="mt-0.5 text-xs text-neutral-400">
              Escolha até {{ MAX_FEATURED_BADGES }} insígnias que aparecerão no seu cartão público de membro.
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-[#f3f3f3] px-2.5 py-1 text-xs text-neutral-500">
            {{ featuredIds.length }} de {{ MAX_FEATURED_BADGES }}
          </span>
        </div>

        <p v-if="badges.length === 0" class="mt-4 text-sm text-neutral-500">
          Você ainda não conquistou nenhuma badge. Elas aparecem aqui conforme você usa o Fimap.
        </p>

        <template v-else>
          <ul v-if="featuredBadges.length" class="mt-4 grid gap-3 md:grid-cols-3">
            <li
              v-for="badge in featuredBadges"
              :key="badge.id"
              class="flex items-center gap-3 rounded-xl bg-[#f3f3f3] p-3"
            >
              <BadgeIcon :icone="badge.icone" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-neutral-900">{{ badge.nome }}</p>
                <p class="truncate text-xs text-neutral-400">{{ badge.descricao }}</p>
              </div>
              <button
                type="button"
                class="rounded-full p-1 text-neutral-400 transition hover:bg-white hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                :aria-label="`Remover ${badge.nome} dos destaques`"
                @click="removeFeatured(badge.id)"
              >
                <X class="size-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-neutral-500">Nenhuma badge em destaque por enquanto.</p>

          <button
            type="button"
            :class="[ui.btnGray, 'mt-4']"
            @click="pickerOpen = true"
          >
            <CirclePlus class="size-4" aria-hidden="true" />
            Alterar Badges em Destaque
          </button>
        </template>
      </div>

      <!-- Rodapé -->
      <div class="flex flex-col items-end gap-2">
        <button type="submit" :class="pillButton" :disabled="!canSubmit">
          <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
          <Save v-else class="size-4" aria-hidden="true" />
          {{ bottomButtonLabel }}
        </button>
        <p class="text-xs text-neutral-400">
          {{
            isCreate
              ? 'Você poderá editar essas informações quando quiser.'
              : 'Atualizações refletem instantaneamente nos tópicos e feeds.'
          }}
        </p>
      </div>
    </form>

    <BadgePickerDialog
      v-model:open="pickerOpen"
      :badges="badges"
      :selected="featuredIds"
      :max="MAX_FEATURED_BADGES"
      @confirm="applyFeatured"
    />
  </section>
  </div>
</template>
