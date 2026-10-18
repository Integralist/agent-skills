# Archived skills

Skills kept for reference but no longer in use. `make install-agents` (part
of `make install`) syncs only `.agents/skills/`, so nothing here is
installed, and its `rsync --delete` removes these from `~/.agents/skills/`
on the next install.

To restore one, move it back and reinstall:

```bash
git mv archive/skills/<name> .agents/skills/<name>
make install
```

Then add its row back to the Skill reference table in the root `README.md`,
and repoint any links it uses: its relative links were rewritten to resolve
from this directory.
