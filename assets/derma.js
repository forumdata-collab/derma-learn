/* 皮紋分析學習站 — quiz interaction + certificate system (no deps) */
(function () {
  'use strict';

  // Score store: { levelId: {score, total, passed} } — survives quiz retries
  const results = {};
  const CERT_KEY = 'derma-learn-certificates';

  const scores = () => Object.values(results);
  const ALL_PASSED = () => scores().length === 3 && scores().every(r => r.passed);

  // ---- Level tabs ----
  const tabs = document.querySelectorAll('.tab');
  const levels = document.querySelectorAll('.level');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    levels.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('level-' + t.dataset.level).classList.add('active');
  }));

  // ---- Quiz grading ----
  document.querySelectorAll('.quiz').forEach(quiz => {
    const btn = quiz.querySelector('.submit-btn');
    const scoreBox = quiz.querySelector('.score-box');
    const questions = Array.from(quiz.querySelectorAll('.q-item'));
    const levelId = quiz.closest('.level').id.replace('level-', '');

    const grade = () => {
      // Require ALL questions answered before grading (integrity of the 80% bar)
      const unanswered = questions.filter(q => !q.querySelector('input:checked'));
      if (unanswered.length > 0) {
        scoreBox.querySelector('.score-msg').textContent = '⚠️ 仲有 ' + unanswered.length + ' 題未答，答埋先可以提交';
        scoreBox.style.display = 'block';
        scoreBox.style.color = '#EF5350';
        unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      scoreBox.style.color = '';

      let score = 0;
      questions.forEach(q => {
        const idx = parseInt(q.dataset.index, 10);
        const options = q.querySelectorAll('input[type="radio"]');
        const given = Array.prototype.findIndex.call(options, o => o.checked);
        const explain = q.querySelector('.explain');
        if (given === idx) {
          score++;
          explain.className = 'explain correct';
          options.forEach((o, i) => { if (o.checked) o.parentElement.classList.add('opt-correct'); });
        } else {
          explain.className = 'explain wrong';
          options.forEach((o, i) => {
            if (i === given) o.parentElement.classList.add('opt-wrong');
            if (i === idx) o.parentElement.classList.add('opt-correct');
          });
        }
      });
      const total = questions.length;
      const passed = score >= total * 0.8; // ≥80% per level
      results[levelId] = { score, total, passed };

      scoreBox.querySelector('.score-num').textContent = score;
      scoreBox.querySelector('.score-total').textContent = total;
      scoreBox.querySelector('.score-msg').textContent =
        score === total ? '🌟 滿分！你已掌握此程度' :
        passed ? '👍 合格（≥80%），進行下一級' :
        score >= total * 0.6 ? '💪 未達 80%，可以撳「重試」再挑戰' : '🔻 未達 80%，撳「重試」溫習後再挑戰';
      scoreBox.style.display = 'block';
      btn.disabled = true;
      btn.textContent = '已提交 ✓';
      questions.forEach(q => q.classList.add('graded'));
      // Retry button appears after grading (only when not full marks? always allow retry)
      const retry = quiz.querySelector('.retry-btn');
      if (!retry) {
        const r = document.createElement('button');
        r.className = 'submit-btn retry-btn';
        r.textContent = '🔄 重試';
        r.style.background = '#5D4037';
        r.style.color = '#F5F0E8';
        r.addEventListener('click', () => resetQuiz(quiz, questions, btn, r));
        scoreBox.after(r);
      } else {
        retry.style.display = 'block';
      }

      // After all 3 levels: pass >=80%? -> offer certificate
      updateCertGate();
    };

    btn.addEventListener('click', grade);
  });

  function resetQuiz(quiz, questions, btn, retry) {
    delete results[quiz.closest('.level').id.replace('level-', '')];
    questions.forEach(q => {
      q.querySelectorAll('input[type="radio"]').forEach(o => { o.checked = false; o.parentElement.classList.remove('opt-correct', 'opt-wrong'); });
      const ex = q.querySelector('.explain');
      ex.className = 'explain';
      q.classList.remove('graded');
    });
    const sb = quiz.querySelector('.score-box');
    sb.style.display = 'none';
    sb.style.color = '';
    btn.disabled = false;
    btn.textContent = '提交答案';
    if (retry) retry.style.display = 'none';
    updateCertGate();
  }

  // ---- Certificate gate ----
  function updateCertGate() {
    const gate = document.getElementById('cert-gate');
    if (!gate) return;
    if (ALL_PASSED()) {
      gate.style.display = 'block';
      gate.querySelector('.cert-hint').textContent =
        '✅ 三級全部通過（每級 ≥80%）！輸入名字獲得證書 🎓';
    } else {
      gate.style.display = 'none';
    }
  }

  // ---- Certificate modal ----
  const CERT_TEMPLATE = (data) => `
    <div class="cert">
      <div class="cert-inner">
        <div class="cert-top">🎓 恭 喜 修 畢 🎓</div>
        <div class="cert-title">皮紋分析學習證書</div>
        <div class="cert-line">Certificate of Completion</div>
        <div class="cert-name">${escHtml(data.name)}</div>
        <div class="cert-sub">已完成皮紋分析學習站全部課程，並通過三級測驗（每級 ≥80%）。</div>
        <div class="cert-scores">
          ${data.scores.map(s => `<span>${escHtml(s.label)}：${s.score}/${s.total}</span>`).join('<span class="sep">·</span>')}
        </div>
        <div class="cert-date">${escHtml(data.date)}</div>
        <div class="cert-foot">— 皮紋分析學習站 Derma-Learn —</div>
      </div>
    </div>`;

  function buildCertGateAndModal() {
    const gate = document.createElement('div');
    gate.id = 'cert-gate';
    gate.className = 'cert-gate screen-only';
    gate.style.display = 'none';
    gate.innerHTML = `
      <p class="cert-hint"></p>
      <button class="submit-btn" id="open-cert">🎓 領取證書</button>`;
    document.querySelector('main').appendChild(gate);

    document.getElementById('open-cert').addEventListener('click', () => {
      document.getElementById('cert-modal').style.display = 'flex';
    });

    const modal = document.createElement('div');
    modal.id = 'cert-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-box">
        <div id="name-step">
          <h3>🎓 領取證書</h3>
          <p class="cert-hint">恭喜你完成全部課程！請輸入姓名印上證書：</p>
          <input type="text" id="cert-name-input" placeholder="你的名字" maxlength="20">
          <div class="modal-actions">
            <button class="btn-ghost" id="cert-cancel">取消</button>
            <button class="submit-btn" id="cert-confirm" style="flex:1">確認</button>
          </div>
        </div>
        <div id="cert-step" style="display:none">
          <div id="cert-render"></div>
          <div class="modal-actions">
            <button class="btn-ghost" id="cert-print">🖨️ 列印</button>
            <button class="submit-btn" id="cert-close" style="flex:1">完成 🎉</button>
          </div>
          <p class="cert-saved">💾 證書已保存在此瀏覽器</p>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('cert-cancel').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cert-confirm').addEventListener('click', () => {
      const name = document.getElementById('cert-name-input').value.trim() || '同學';
      const data = {
        name,
        date: new Date().toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' }),
        scores: [
          { label: '入門級', score: results.basic.score, total: results.basic.total },
          { label: '進階級', score: results.intermediate.score, total: results.intermediate.total },
          { label: '研究級', score: results.advanced.score, total: results.advanced.total },
        ],
        ts: Date.now()
      };
      document.getElementById('cert-render').innerHTML = CERT_TEMPLATE(data);
      document.getElementById('name-step').style.display = 'none';
      document.getElementById('cert-step').style.display = 'block';
      saveCert(data);
    });
    document.getElementById('cert-print').addEventListener('click', () => window.print());
    document.getElementById('cert-close').addEventListener('click', () => { modal.style.display = 'none'; gate.querySelector('#open-cert').textContent = '🎓 檢視證書'; });
  }

  function saveCert(data) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(CERT_KEY) || '[]'); } catch (e) {}
    list.push(data);
    localStorage.setItem(CERT_KEY, JSON.stringify(list));
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCertGateAndModal);
  } else {
    buildCertGateAndModal();
  }
})();