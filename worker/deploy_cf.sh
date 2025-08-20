#!/bin/bash
# filepath: cloudflare/deploy.sh

set -e  # 遇到错误立即停止
# 兼容 macOS 和 Linux 的 sed -i 参数
if [[ "$(uname -s)" == "Darwin" ]]; then
    SED_INPLACE=(-i '')
else
    SED_INPLACE=(-i)
fi

echo "=== 部署 zerotier-web 到 Cloudflare ==="

# 颜色输出函数
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要工具
check_requirements() {
    info "检查必要工具..."
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        info "安装 Wrangler CLI..."
        npm install -g wrangler
    fi
    
    info "检查 Wrangler 登录状态..."
    if printf '%s' "$(wrangler whoami)" | grep -Eqi 'not|unauthenticated|please run `wrangler login`|not authenticated|not logged in'; then
        warn "请先登录 Wrangler: wrangler login"
        exit 1
    fi
}


deploy_worker() {
    info "=== 步骤 1: 部署 Cloudflare Workers ==="
    
    # 安装依赖
    info "安装 Worker 依赖..."
    npm install
    
    # 部署 Worker
    info "部署 Worker..."
    DEPLOY_OUTPUT=$(wrangler deploy --env= --assets ./static"" 2>&1)
    
    # 提取 Worker URL
    if echo "$DEPLOY_OUTPUT" | grep -q "https://"; then
        WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*' | head -1)
        # 移除可能的尾部斜杠
        WORKER_URL=${WORKER_URL%/}
        info "Worker 部署成功: $WORKER_URL"
    else
        error "无法获取 Worker URL，请检查部署输出"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
    
    # 保存 Worker URL 到临时文件
    echo "$WORKER_URL" > .worker_url
}

deploy_secrets() {
    info "=== 步骤 2: 设置 Worker Secrets ==="

    echo "Setting worker secrets (interactive). Ensure you are logged in with wrangler."
    echo "Setting ZT_API_TOKEN ..."
    (wrangler secret put ZT_API_TOKEN)
    echo "Setting ZT_NETWORK_ID ..."
    (wrangler secret put ZT_NETWORK_ID)
    echo "Optionally set UI_PASSWORD ..."
    (wrangler secret put UI_PASSWORD || true)
}

# 清理临时文件
cleanup() {
    info "清理临时文件..."
    rm -f .worker_url 
}

# 显示部署结果
show_results() {
    info "=== 部署完成! ==="
    
    WORKER_URL=$(cat .worker_url 2>/dev/null || echo "请手动检查")
    
    echo ""
    echo "🎉 部署结果:"
    echo "  - Worker 访问地址: $WORKER_URL"
}

# 错误处理
trap cleanup EXIT

# 主执行流程
main() {
    check_requirements
    deploy_worker
    deploy_secrets
    show_results
}

# 执行主函数
main "$@"