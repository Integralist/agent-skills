install-claude:
	mkdir -p ~/.claude
	cp -r .claude/ ~/.claude/

install-agents:
	mkdir -p ~/.agents
	cp -r .agents/ ~/.agents/

.PHONY: install
install: install-claude install-agents

.PHONY: force-add
force-add:
	git add -f .claude/
