#!/usr/bin/env bash
#
# Builda e roda a invest-renda-web (Angular) a partir do Dockerfile na raiz
# do projeto - build multi-estagio (Node compila, Nginx serve os arquivos
# estaticos). Mostra um painel visual com o progresso.
#
# Uso:
#   ./run.sh          builda/roda o app, acompanha health e segue os logs
#   ./run.sh status   só mostra o status uma vez e sai
#   ./run.sh logs     só segue os logs do container (sem rebuildar/subir nada)
#   ./run.sh down     derruba o container

set -euo pipefail

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

APP_IMAGE="invest-renda-web:local"
APP_CONTAINER="invest-renda-web"
HOST_PORT="4200"
CONTAINER_PORT="8080"

COMMAND="${1:-up}"

if [ -t 1 ]; then
    BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
    RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'
    BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'
else
    BOLD=""; DIM=""; RESET=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""
fi

FRAMES=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)

# ---------------------------------------------------------------------------
# Helpers visuais
# ---------------------------------------------------------------------------

banner() {
    printf '\n%s%s┌─────────────────────────────────────────────────┐%s\n' "$BOLD" "$CYAN" "$RESET"
    printf '%s%s│  %-47s│%s\n' "$BOLD" "$CYAN" "invest-renda-web - run.sh" "$RESET"
    printf '%s%s└─────────────────────────────────────────────────┘%s\n\n' "$BOLD" "$CYAN" "$RESET"
}

step() { printf '%s%s▶ %s%s\n' "$BOLD" "$BLUE" "$1" "$RESET"; }
ok()   { printf '  %s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
fail() { printf '  %s✖%s %s\n' "$RED" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }

# ---------------------------------------------------------------------------
# Preflight: garante que o Docker Desktop esta rodando
# ---------------------------------------------------------------------------

ensure_docker_running() {
    step "Verificando o Docker"
    if docker info >/dev/null 2>&1; then
        ok "Docker já está em execução"
        return
    fi

    warn "Docker não está rodando, tentando iniciar..."
    if [[ "$(uname -s)" == "Darwin" ]]; then
        open -a Docker >/dev/null 2>&1 || true
    fi

    local i=0 frame_idx=0
    while ! docker info >/dev/null 2>&1; do
        i=$((i + 1))
        frame_idx=$(((frame_idx + 1) % ${#FRAMES[@]}))
        printf '\r  %s%s%s aguardando o Docker subir... (%ss)' "$CYAN" "${FRAMES[$frame_idx]}" "$RESET" "$i"
        if [ "$i" -ge 60 ]; then
            printf '\n'
            fail "Docker não iniciou em 60s. Abra o Docker Desktop manualmente e rode o script de novo."
            exit 1
        fi
        sleep 1
    done
    printf '\r\033[K'
    ok "Docker está em execução"
}

# ---------------------------------------------------------------------------
# Painel de saude (um unico servico: o app)
# ---------------------------------------------------------------------------

STATUS="pending"

refresh_status() {
    STATUS="$(docker inspect -f '{{.State.Health.Status}}' "$APP_CONTAINER" 2>/dev/null || echo "unknown")"
}

render_dashboard() {
    local frame="$1" first_render="$2" icon text

    if [ "$first_render" != "true" ]; then
        printf '\033[1A'
    fi

    case "$STATUS" in
        healthy)   icon="${GREEN}✔${RESET}"; text="${GREEN}saudável${RESET}" ;;
        unhealthy) icon="${RED}✖${RESET}"; text="${RED}com problema${RESET}" ;;
        unknown)   icon="${DIM}·${RESET}"; text="${DIM}container não encontrado${RESET}" ;;
        *)         icon="${CYAN}${frame}${RESET}"; text="${DIM}iniciando...${RESET}" ;;
    esac
    printf '  %s %-18s %s\033[K\n' "$icon" "invest-renda-web" "$text"
}

wait_for_health() {
    step "Aguardando o app ficar saudável"
    echo

    local first_render="true" frame_idx=0 elapsed=0 timeout=60

    render_dashboard "${FRAMES[0]}" "true"
    first_render="false"

    while true; do
        refresh_status

        if [ "$STATUS" = "unhealthy" ]; then
            frame_idx=$(((frame_idx + 1) % ${#FRAMES[@]}))
            render_dashboard "${FRAMES[$frame_idx]}" "$first_render"
            echo
            fail "O container ficou 'unhealthy'. Últimas linhas de log:"
            printf '\n  %s--- invest-renda-web ---%s\n' "$DIM" "$RESET"
            docker logs --tail 20 "$APP_CONTAINER" 2>&1 | sed 's/^/  /'
            exit 1
        fi

        if [ "$STATUS" = "healthy" ]; then
            frame_idx=$(((frame_idx + 1) % ${#FRAMES[@]}))
            render_dashboard "${FRAMES[$frame_idx]}" "$first_render"
            break
        fi

        frame_idx=$(((frame_idx + 1) % ${#FRAMES[@]}))
        render_dashboard "${FRAMES[$frame_idx]}" "$first_render"

        elapsed=$((elapsed + 1))
        if [ "$elapsed" -ge "$timeout" ]; then
            echo
            fail "Timeout de ${timeout}s esperando o app ficar saudável."
            exit 1
        fi
        sleep 1
    done

    echo
    ok "App saudável"
}

# ---------------------------------------------------------------------------
# App (Dockerfile na raiz do projeto)
# ---------------------------------------------------------------------------

build_and_run_app() {
    step "Construindo a imagem do app (Dockerfile na raiz)"
    docker build -t "$APP_IMAGE" -f Dockerfile .
    ok "Imagem construída"
    echo

    step "Subindo o container do app"
    docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
    docker run -d \
        --name "$APP_CONTAINER" \
        -p "${HOST_PORT}:${CONTAINER_PORT}" \
        --health-cmd="wget --spider -q http://127.0.0.1:${CONTAINER_PORT}/ || exit 1" \
        --health-interval=5s \
        --health-timeout=5s \
        --health-retries=10 \
        --health-start-period=5s \
        "$APP_IMAGE" >/dev/null
    ok "Container do app no ar"
    echo

    wait_for_health
}

summary_panel() {
    printf '\n%s%s  ✔ Tudo no ar%s\n\n' "$BOLD" "$GREEN" "$RESET"
    printf '  %-18s %s%s%s\n\n' "App" "$CYAN" "http://localhost:${HOST_PORT}" "$RESET"
    printf '  %sLembre-se: a invest-renda-api precisa estar rodando à parte (./run.sh%s\n' "$DIM" "$RESET"
    printf '  %sno projeto dela) para as telas funcionarem de verdade.%s\n' "$DIM" "$RESET"
    printf '\n'
}

# ---------------------------------------------------------------------------
# Comandos
# ---------------------------------------------------------------------------

cmd_up() {
    banner
    ensure_docker_running
    build_and_run_app
    summary_panel

    step "Acompanhando os logs do app (Ctrl+C para sair — o container continua rodando)"
    echo
    trap 'echo; ok "Saindo do acompanhamento de logs. O container continua rodando."; exit 0' INT
    docker logs -f "$APP_CONTAINER"
}

cmd_status() {
    banner
    refresh_status
    render_dashboard "${FRAMES[0]}" "true"
    echo
}

cmd_logs() {
    banner
    step "Acompanhando os logs do app (Ctrl+C para sair)"
    echo
    docker logs -f "$APP_CONTAINER"
}

cmd_down() {
    banner
    step "Derrubando o container do app"
    docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
    ok "Container removido"
}

case "$COMMAND" in
    up) cmd_up ;;
    status) cmd_status ;;
    logs) cmd_logs ;;
    down) cmd_down ;;
    *)
        echo "Uso: $0 [up|status|logs|down]"
        exit 1
        ;;
esac
