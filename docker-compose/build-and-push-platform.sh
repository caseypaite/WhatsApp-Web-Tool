#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_CONFIG_DIR="${DOCKER_CONFIG:-$HOME/.docker}"
DOCKER_CONFIG_FILE="${DOCKER_CONFIG_DIR}/config.json"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-https://index.docker.io/v1/}"
BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-wawat-backend}"
FRONTEND_IMAGE_NAME="${FRONTEND_IMAGE_NAME:-wawat-frontend}"
BUILDER_NAME="${BUILDER_NAME:-wawat-multiarch}"

log() {
  printf '[publish-images] %s\n' "$*"
}

fail() {
  printf '[publish-images] %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

detect_host_platform() {
  local raw_arch

  raw_arch="$(docker version --format '{{.Server.Arch}}' 2>/dev/null || uname -m)"

  case "${raw_arch}" in
    amd64|x86_64)
      printf 'linux/amd64\n'
      ;;
    arm64|aarch64)
      printf 'linux/arm64\n'
      ;;
    armv7l|armv7|arm/v7)
      printf 'linux/arm/v7\n'
      ;;
    *)
      fail "Unsupported architecture '${raw_arch}'. Set DOCKER_PLATFORM explicitly."
      ;;
  esac
}

resolve_target_platforms() {
  if [[ -n "${DOCKER_PLATFORMS:-}" ]]; then
    printf '%s\n' "${DOCKER_PLATFORMS}"
    return
  fi

  printf 'linux/amd64,linux/arm64\n'
}

ensure_builder() {
  local -a install_command=(
    docker run --privileged --rm tonistiigi/binfmt --install amd64,arm64
  )

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf '[publish-images] DRY_RUN '
    printf '%q ' "${install_command[@]}"
    printf '\n'
  else
    "${install_command[@]}" >/dev/null
  fi

  if docker buildx inspect "${BUILDER_NAME}" >/dev/null 2>&1; then
    [[ "${DRY_RUN:-0}" == "1" ]] || docker buildx use "${BUILDER_NAME}" >/dev/null
  else
    local -a create_command=(
      docker buildx create
      --name "${BUILDER_NAME}"
      --driver docker-container
      --use
    )

    if [[ "${DRY_RUN:-0}" == "1" ]]; then
      printf '[publish-images] DRY_RUN '
      printf '%q ' "${create_command[@]}"
      printf '\n'
    else
      "${create_command[@]}" >/dev/null
    fi
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf '[publish-images] DRY_RUN docker buildx inspect --bootstrap %q\n' "${BUILDER_NAME}"
  else
    docker buildx inspect "${BUILDER_NAME}" --bootstrap >/dev/null
  fi
}

username_from_auth() {
  [[ -f "${DOCKER_CONFIG_FILE}" ]] || return 1

  local auth
  auth="$(jq -r --arg registry "${DOCKER_REGISTRY}" '.auths[$registry].auth // empty' "${DOCKER_CONFIG_FILE}")"
  [[ -n "${auth}" ]] || return 1

  printf '%s' "${auth}" | base64 --decode 2>/dev/null | cut -d: -f1
}

username_from_creds_store() {
  [[ -f "${DOCKER_CONFIG_FILE}" ]] || return 1

  local helper_suffix helper payload username
  helper_suffix="$(jq -r '.credsStore // .credStore // empty' "${DOCKER_CONFIG_FILE}")"
  [[ -n "${helper_suffix}" ]] || return 1

  helper="docker-credential-${helper_suffix}"
  command -v "${helper}" >/dev/null 2>&1 || return 1

  payload="$(printf '%s' "${DOCKER_REGISTRY}" | "${helper}" get 2>/dev/null || true)"
  username="$(printf '%s' "${payload}" | jq -r '.Username // empty' 2>/dev/null || true)"
  [[ -n "${username}" ]] || return 1

  printf '%s\n' "${username}"
}

detect_namespace() {
  if [[ -n "${DOCKER_NAMESPACE:-}" ]]; then
    printf '%s\n' "${DOCKER_NAMESPACE}"
    return
  fi

  local username
  username="$(username_from_auth || true)"
  if [[ -z "${username}" ]]; then
    username="$(username_from_creds_store || true)"
  fi

  [[ -n "${username}" ]] || fail "Unable to detect Docker Hub username from ${DOCKER_CONFIG_FILE}. Set DOCKER_NAMESPACE explicitly."
  printf '%s\n' "${username}"
}

build_and_push() {
  local image_name="$1"
  local context_dir="$2"
  local dockerfile_path="$3"
  local image_ref_base="${NAMESPACE}/${image_name}"
  local -a build_tags=()
  local tag

  for tag in "${TAGS[@]}"; do
    build_tags+=(--tag "${image_ref_base}:${tag}")
  done

  local -a command=(
    docker buildx build
    --builder "${BUILDER_NAME}"
    --platform "${PLATFORMS}"
    --file "${dockerfile_path}"
    "${build_tags[@]}"
    --push
    "${context_dir}"
  )

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf '[publish-images] DRY_RUN '
    printf '%q ' "${command[@]}"
    printf '\n'
    return
  fi

  "${command[@]}"
}

require_command docker
require_command jq
require_command base64

docker buildx version >/dev/null 2>&1 || fail "docker buildx is required."

HOST_PLATFORM="$(detect_host_platform)"
PLATFORMS="$(resolve_target_platforms)"
NAMESPACE="$(detect_namespace)"

if [[ "$#" -gt 0 ]]; then
  TAGS=("$@")
else
  TAGS=(latest)
fi

log "Namespace: ${NAMESPACE}"
log "Host platform: ${HOST_PLATFORM}"
log "Target platforms: ${PLATFORMS}"
log "Tags: ${TAGS[*]}"

ensure_builder

build_and_push "${BACKEND_IMAGE_NAME}" "${REPO_ROOT}/backend" "${REPO_ROOT}/backend/Dockerfile"
build_and_push "${FRONTEND_IMAGE_NAME}" "${REPO_ROOT}/frontend" "${REPO_ROOT}/frontend/Dockerfile"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  log "Dry run complete for ${NAMESPACE}/${BACKEND_IMAGE_NAME} and ${NAMESPACE}/${FRONTEND_IMAGE_NAME}"
else
  log "Published ${NAMESPACE}/${BACKEND_IMAGE_NAME} and ${NAMESPACE}/${FRONTEND_IMAGE_NAME} for tags: ${TAGS[*]}"
fi
