/* 皮紋分析學習站 — quiz interaction (no deps) */
(function () {
  'use strict';

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
    const questions = quiz.querySelectorAll('.q-item');

    const grade = () => {
      let score = 0;
      questions.forEach(q => {
        const idx = parseInt(q.dataset.index, 10);
        const options = q.querySelectorAll('input[type="radio"]');
        const given = Array.prototype.findIndex.call(options, o => o.checked);
        if (given === -1) return; // unanswered: leave untouched
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
      scoreBox.querySelector('.score-num').textContent = score;
      scoreBox.querySelector('.score-total').textContent = total;
      scoreBox.querySelector('.score-msg').textContent =
        score === total ? '🌟 滿分！你已掌握此程度' :
        score >= total * 0.6 ? '👍 唔錯，可以再溫一次鞏固' : '💪 再睇多次內容，然後重試';
      scoreBox.style.display = 'block';
      btn.disabled = true;
      btn.textContent = '已提交 ✓';
      questions.forEach(q => q.classList.add('graded'));
    };

    // mark graded state lost on answered submits: answers chosen but unsubmitted
    btn.addEventListener('click', grade);
  });
})();