import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import pytest
import report


@pytest.fixture(autouse=True)
def isolated_report_output(tmp_path, monkeypatch):
    """Tests must never overwrite the user\'s bookmarked report."""
    monkeypatch.setattr(report, "OUTPUT", tmp_path / "llm-stats.html")
