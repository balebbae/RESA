.PHONY: dev dev-no-tmux stop logs

dev:
	@./scripts/dev.sh

# Force non-tmux mode (useful in CI or limited shells)
dev-no-tmux:
	@TMUX=0 ./scripts/dev.sh

stop:
	@pkill -f "air$" || true
	@pkill -f "npm run dev" || true
	@echo "Stopped local dev processes. Docker services remain running."

logs:
	@tail -n +1 -f tmp/logs/backend.log tmp/logs/frontend.log


