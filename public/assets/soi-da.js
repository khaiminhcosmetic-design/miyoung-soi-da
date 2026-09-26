(function () {
  'use strict';

  // Mục 13.1 - Khối cấu hình trang soi da
  const CONFIG = {
    MESSENGER_URL: 'https://m.me/miyoungvn',
    WEBHOOK_URL: '/api/leads', // để trống = chế độ demo, không gửi dữ liệu
    NOTICE_VERSION: 'TB-DLCN-SOIDA v1.2 (24/09/2026)',
    RETENTION: '24 tháng kể từ lần tương tác gần nhất, hoặc xóa sớm hơn khi bạn yêu cầu',
    CONTROLLER: {
      name: 'Công ty TNHH SX TM XNK Khải Minh Factory (thương hiệu MIYOUNG)',
      tax: '1102152606',
      address: 'K15, Khu B, Đường CN5, Khu xưởng Kizuna 3, Xã Cần Giuộc, Tỉnh Tây Ninh',
      phone: '090 398 88 08',
      email: 'Khaiminh.cosmetic@gmail.com',
    },
  };

  // Mục 4.2 - Bộ câu hỏi
  const QUESTIONS = [
    {
      ma: 'feel',
      hoi: 'Khoảng 2 tiếng sau khi rửa mặt, da bạn thường thế nào?',
      dap_an: [
        { gia_tri: 'dry', nhan: 'Căng, khô, đôi khi bong nhẹ' },
        { gia_tri: 'normal', nhan: 'Dễ chịu, không khô không bóng' },
        { gia_tri: 'tzone', nhan: 'Bóng ở trán và mũi, hai má bình thường' },
        { gia_tri: 'oily', nhan: 'Bóng dầu khắp mặt' },
      ],
    },
    {
      ma: 'goal',
      hoi: 'Điều bạn muốn cải thiện nhất lúc này?',
      dap_an: [
        { gia_tri: 'dull', nhan: 'Da xỉn, màu da không đều' },
        { gia_tri: 'marks', nhan: 'Vết thâm sau mụn' },
        { gia_tri: 'sun', nhan: 'Đốm sạm do nắng' },
        { gia_tri: 'dehyd', nhan: 'Da thiếu ẩm, kém mịn' },
      ],
    },
    {
      ma: 'sun',
      hoi: 'Mỗi ngày bạn ra nắng thế nào?',
      dap_an: [
        { gia_tri: 'low', nhan: 'Ít ra nắng, có dùng kem chống nắng' },
        { gia_tri: 'mid', nhan: 'Ra nắng 1 đến 2 tiếng, có dùng kem chống nắng' },
        { gia_tri: 'high', nhan: 'Ra nắng nhiều hoặc hay quên kem chống nắng' },
      ],
    },
    {
      ma: 'routine',
      hoi: 'Bạn đang chăm da ở mức nào?',
      dap_an: [
        { gia_tri: 'none', nhan: 'Chỉ rửa mặt' },
        { gia_tri: 'basic', nhan: 'Rửa mặt và dưỡng ẩm' },
        { gia_tri: 'full', nhan: 'Có đủ bước, gồm cả serum' },
      ],
    },
  ];

  const TIMESLOT_LABELS = { '08-11': '8h – 11h', '11-14': '11h – 14h', '14-17': '14h – 17h', '17-20': '17h – 20h' };

  // Mục 5.3 - Mức và bảng nhãn
  const LEVEL_LABELS = {
    even: { 0: 'Tốt', 1: 'Khá', 2: 'Cần chăm thêm' },
    spots: { 0: 'Ít thâm sạm', 1: 'Thâm sạm vừa', 2: 'Thâm sạm rõ' },
    moist: { 0: 'Đủ ẩm', 1: 'Hơi thiếu ẩm', 2: 'Thiếu ẩm' },
  };

  // Mục 5.3 / 7 - Nội dung 3 nhánh cẩm nang (nguyên văn theo mục 7.1-7.3)
  const BRANCHES = {
    A: {
      ten: 'Sáng mờ thâm',
      san_pham: 'Serum Cordy Luxe + Kem face dẻo phô mai',
      day1: {
        tieu_de: 'Hiểu vùng thâm sạm của bạn',
        giai_thich: 'Thâm sau mụn và đốm sạm do nắng đều đậm lên khi da bị kích ứng hoặc ra nắng không che chắn. Muốn chúng mờ dần, cần dưỡng sáng đều đặn và bảo vệ da mỗi ngày.',
        viec_hom_nay: ['Chụp 1 ảnh mặt mộc gần cửa sổ, lưu lại để so sánh vào ngày 7.', 'Không cạy, nặn mụn từ hôm nay.'],
        goi_y: 'Bộ đôi Serum Cordy Luxe + Kem face dẻo phô mai là trọng tâm của nhánh này. Serum chứa dưỡng chất đông trùng hạ thảo, dùng kèm Kem face dẻo phô mai để nuôi dưỡng da sáng dần tự nhiên.',
        tip: 'Ghi lại ngày bắt đầu trên điện thoại để không bỏ lỡ nhịp chăm da.',
      },
      days2_7: [
        'Ngày 2: Làm sạch dịu nhẹ',
        'Ngày 3: Chống nắng là bước quyết định',
        'Ngày 4: Bắt đầu bộ đôi dưỡng sáng',
        'Ngày 5: Thói quen giúp vết thâm mờ nhanh hơn',
        'Ngày 6: Những sai lầm khiến thâm lâu mờ',
        'Ngày 7: Tự đánh giá và duy trì',
      ],
    },
    B: {
      ten: 'Đều màu rạng rỡ',
      san_pham: 'Serum Cordy Luxe + Kem face dẻo phô mai, Kem body Red Ruby (ngày), Kem body Hephawhite+ (đêm)',
      day1: {
        tieu_de: 'Vì sao da xỉn, không đều màu',
        giai_thich: 'Tế bào chết tích tụ, thiếu ẩm và ánh nắng làm da mất độ rạng rỡ. Nhiều người còn bị chênh màu giữa mặt với cổ và tay.',
        viec_hom_nay: ['Chụp 1 ảnh mặt và cổ gần cửa sổ để so sánh vào ngày 7.', 'Nhìn xem vùng nào chênh màu rõ nhất: trán, hai má, cổ hay tay.'],
        goi_y: 'Nhánh này chăm cả mặt lẫn cơ thể: Serum Cordy Luxe + Kem face dẻo phô mai cho da mặt, Red Ruby ban ngày và Hephawhite+ ban đêm cho da thân, để màu da đều từ mặt xuống cổ, tay.',
        tip: 'Ảnh chụp ánh sáng tự nhiên cho so sánh chính xác hơn ảnh chụp đèn.',
      },
      days2_7: [
        'Ngày 2: Làm sạch đúng cách, mặt và thân',
        'Ngày 3: Chống nắng cả mặt và vùng da hở',
        'Ngày 4: Bắt đầu quy trình mặt và thân',
        'Ngày 5: 1 phút massage cho da tươi tắn',
        'Ngày 6: Những sai lầm làm màu da không đều',
        'Ngày 7: Tự đánh giá và duy trì',
      ],
    },
    C: {
      ten: 'Ẩm mịn căng sáng',
      san_pham: 'Kem face dẻo phô mai, Kem body Hephawhite+ (đêm), Body Oil',
      day1: {
        tieu_de: 'Da thiếu ẩm trông kém sáng hơn',
        giai_thich: 'Khi bề mặt da khô, da phản chiếu ánh sáng kém nên trông xỉn và kém mịn. Da dầu vẫn có thể thiếu ẩm.',
        viec_hom_nay: ['Chạm nhẹ lên má 2 giờ sau rửa mặt, ghi lại cảm giác: căng, ráp hay mềm.', 'Chụp 1 ảnh mặt mộc để so sánh vào ngày 7.'],
        goi_y: 'Trọng tâm nhánh này là giữ ẩm: Kem face dẻo phô mai cho da mặt, Hephawhite+ dưỡng ẩm chuyên sâu ban đêm và Body Oil dùng kèm cho da thân.',
        tip: 'Da đủ ẩm là nền để mọi bước dưỡng sáng phát huy tác dụng.',
      },
      days2_7: [
        'Ngày 2: Làm sạch mà không làm khô da',
        'Ngày 3: Giữ ẩm suốt ngày dài',
        'Ngày 4: Khóa ẩm cho da mặt',
        'Ngày 5: Dưỡng ẩm chuyên sâu ban đêm',
        'Ngày 6: Những sai lầm khiến da khô hơn',
        'Ngày 7: Tự đánh giá và duy trì',
      ],
    },
  };

  // ---------- Trạng thái ứng dụng (chỉ lưu trong bộ nhớ trang, không lưu, không gửi) ----------
  const state = {
    answers: {},
    questionIndex: 0,
    photo: null, // { even, spots } hoặc null - KHÔNG BAO GIỜ chứa ảnh
    result: null, // { even, spots, moist, eL, sL, mL, maKetQua, branch }
    checklistDone: [],
    isSubmitting: false,
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    $(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  // ================= S0 =================
  $('btn-start').addEventListener('click', () => {
    state.questionIndex = 0;
    renderQuestion();
    showScreen('screen-s1');
  });

  // ================= S1 - Bộ câu hỏi (mục 4.2) =================
  function renderQuestion() {
    const q = QUESTIONS[state.questionIndex];
    $('progress-label').textContent = `Câu ${state.questionIndex + 1}/4`;
    const pct = ((state.questionIndex + 1) / QUESTIONS.length) * 100;
    const fill = $('progress-fill');
    fill.style.width = pct + '%';
    fill.setAttribute('aria-valuenow', String(Math.round(pct)));

    const container = $('question-container');
    container.innerHTML = '';

    const h2 = document.createElement('h2');
    h2.textContent = q.hoi;
    h2.style.fontSize = '22px';
    container.appendChild(h2);

    const selected = state.answers[q.ma];
    q.dap_an.forEach((da) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn' + (selected === da.gia_tri ? ' selected' : '');
      btn.textContent = da.nhan;
      btn.addEventListener('click', () => selectAnswer(q.ma, da.gia_tri));
      container.appendChild(btn);
    });
  }

  function selectAnswer(ma, giaTri) {
    state.answers[ma] = giaTri;
    renderQuestion();
    setTimeout(() => {
      if (state.questionIndex < QUESTIONS.length - 1) {
        state.questionIndex++;
        renderQuestion();
      } else {
        showScreen('screen-s2');
      }
    }, 220);
  }

  $('btn-back-s1').addEventListener('click', () => {
    if (state.questionIndex > 0) {
      state.questionIndex--;
      renderQuestion();
    } else {
      showScreen('screen-s0');
    }
  });

  // ================= S2 - Ảnh selfie (mục 4.3 / 5.2) =================
  $('btn-back-s2').addEventListener('click', () => {
    state.questionIndex = QUESTIONS.length - 1;
    renderQuestion();
    showScreen('screen-s1');
  });

  $('btn-pick-photo').addEventListener('click', () => $('photo-input').click());

  $('photo-input').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) analyzePhoto(file);
  });

  $('btn-skip-photo').addEventListener('click', () => {
    state.photo = null;
    goToResult();
  });

  function setPhotoStatus(text, isError) {
    const el = $('photo-status');
    el.textContent = text;
    el.classList.toggle('error', !!isError);
  }

  // Mục 5.2 - Đo ảnh trên thiết bị, không bao giờ gửi hay lưu ảnh
  function analyzePhoto(file) {
    setPhotoStatus('Đang đo trên điện thoại của bạn…', false);
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 160 / img.width;
      canvas.width = 160;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const x0 = Math.floor(canvas.width * 0.25);
      const x1 = Math.ceil(canvas.width * 0.75);
      const y0 = Math.floor(canvas.height * 0.25);
      const y1 = Math.ceil(canvas.height * 0.75);
      const { data } = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);

      const lums = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 60 && r > g && g > b * 0.9 && (r - b) > 12) {
          lums.push(0.299 * r + 0.587 * g + 0.114 * b);
        }
      }

      // Dọn ngay: xóa canvas, thu về 0, hủy URL, reset input - không giữ ảnh
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
      URL.revokeObjectURL(url);
      $('photo-input').value = '';

      if (lums.length < 400) {
        state.photo = null;
        setPhotoStatus('Ảnh chưa đủ rõ vùng da mặt. Thử chụp gần hơn, đủ sáng, hoặc bấm Bỏ qua.', true);
        return;
      }

      const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
      const variance = lums.reduce((a, v) => a + (v - mean) * (v - mean), 0) / lums.length;
      const sd = Math.sqrt(variance);
      const darkCount = lums.filter((l) => l < 0.82 * mean).length;
      const dark = darkCount / lums.length;

      state.photo = {
        even: clamp(100 - (sd / mean) * 260, 0, 100),
        spots: clamp(dark * 260, 0, 100),
      };

      setPhotoStatus('Đã đo xong và xóa ảnh khỏi bộ nhớ trang.', false);
      setTimeout(goToResult, 600);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      $('photo-input').value = '';
      state.photo = null;
      setPhotoStatus('Ảnh chưa đủ rõ vùng da mặt. Thử chụp gần hơn, đủ sáng, hoặc bấm Bỏ qua.', true);
    };

    img.src = url;
  }

  // ================= Mục 5 - Thuật toán chấm điểm =================
  function computeResult() {
    const a = state.answers;
    let even = 78;
    let spots = 22;
    const moistBase = { dry: 35, normal: 78, tzone: 66, oily: 58 };
    let moist = moistBase[a.feel];

    if (a.goal === 'dull') even -= 22;
    if (a.goal === 'marks') spots += 30;
    if (a.goal === 'sun') { spots += 24; even -= 8; }
    if (a.goal === 'dehyd') moist -= 18;

    spots += { low: 0, mid: 10, high: 22 }[a.sun];
    even -= { low: 0, mid: 4, high: 14 }[a.sun];

    if (a.routine === 'none') { moist -= 8; even -= 4; }

    if (state.photo) {
      even = even * 0.6 + state.photo.even * 0.4;
      spots = spots * 0.6 + state.photo.spots * 0.4;
    }

    even = clamp(Math.round(even), 0, 100);
    spots = clamp(Math.round(spots), 0, 100);
    moist = clamp(Math.round(moist), 0, 100);

    const eL = even >= 70 ? 0 : even >= 50 ? 1 : 2;
    const sL = spots <= 30 ? 0 : spots <= 55 ? 1 : 2;
    const mL = moist >= 70 ? 0 : moist >= 50 ? 1 : 2;
    const ABC = ['A', 'B', 'C'];
    const maKetQua = 'MY-' + ABC[eL] + ABC[sL] + ABC[mL];

    const worst = Math.max(sL, eL, mL);
    let branch;
    if (worst === 0) branch = 'B';
    else if (sL === worst) branch = 'A';
    else if (eL === worst) branch = 'B';
    else branch = 'C';

    return { even, spots, moist, eL, sL, mL, maKetQua, branch, sun: a.sun, hasPhoto: !!state.photo };
  }

  function joinVN(items) {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + ' và ' + items[1];
    return items.slice(0, -1).join(', ') + ' và ' + items[items.length - 1];
  }

  // Mục 6.1 - Câu ưu tiên
  function buildPriorityText(r) {
    const parts = [];
    if (r.sL > 0) parts.push('làm mờ vùng thâm sạm');
    if (r.eL > 0) parts.push('cải thiện độ đều màu');
    if (r.mL > 0) parts.push('bổ sung độ ẩm');
    if (parts.length === 0) {
      return 'Da bạn đang khá cân bằng. Giữ nhịp dưỡng ẩm và chống nắng đều đặn.';
    }
    return 'Ưu tiên của bạn: ' + joinVN(parts) + '.';
  }

  // Mục 6.3 - Gợi ý chăm sóc (không nêu tên sản phẩm)
  function buildCareList(r) {
    const list = [];
    list.push('Sáng: làm sạch dịu nhẹ, dưỡng ẩm, rồi thoa kem chống nắng kể cả khi ở trong nhà gần cửa sổ.');
    if (r.mL > 0) {
      list.push('Tối: tẩy trang, làm sạch, sau đó khóa ẩm bằng kem dưỡng dày hơn buổi sáng.');
    } else {
      list.push('Tối: tẩy trang, làm sạch, dùng sản phẩm dưỡng sáng rồi dưỡng ẩm.');
    }
    if (r.sL > 0 || r.eL > 0) {
      list.push('Kiên trì ít nhất 4 tuần với cùng một quy trình dưỡng sáng trước khi đánh giá lại.');
    }
    if (r.sun === 'high') {
      list.push('Thoa lại kem chống nắng sau 2 đến 3 tiếng khi ở ngoài trời.');
    }
    return list;
  }

  // ================= S3 - Kết quả (mục 6-9) =================
  function goToResult() {
    const r = computeResult();
    state.result = r;
    state.checklistDone = [];
    renderResult(r);
    renderJourney(r);
    showScreen('screen-s3');
  }

  function renderResult(r) {
    $('result-code').textContent = r.maKetQua;
    $('priority-text').textContent = buildPriorityText(r);

    $('region-forehead').setAttribute('fill-opacity', [0.2, 0.55, 0.9][r.eL]);
    $('region-cheek-l').setAttribute('fill-opacity', [0.2, 0.55, 0.9][r.sL]);
    $('region-cheek-r').setAttribute('fill-opacity', [0.2, 0.55, 0.9][r.sL]);
    $('region-chin').setAttribute('fill-opacity', [0.2, 0.55, 0.9][r.mL]);

    $('meter-even-label').textContent = LEVEL_LABELS.even[r.eL];
    $('meter-spots-label').textContent = LEVEL_LABELS.spots[r.sL];
    $('meter-moist-label').textContent = LEVEL_LABELS.moist[r.mL];

    requestAnimationFrame(() => {
      $('meter-even-fill').style.width = r.even + '%';
      $('meter-spots-fill').style.width = (100 - r.spots) + '%';
      $('meter-moist-fill').style.width = r.moist + '%';
    });

    $('calc-note').textContent = r.hasPhoto
      ? 'Tính từ câu trả lời của bạn kết hợp số đo độ đều màu trên ảnh. Ánh sáng khi chụp có thể làm lệch kết quả.'
      : 'Tính từ câu trả lời của bạn. Thêm ảnh selfie ở lần soi sau để kết quả sát hơn.';

    const careList = $('care-list');
    careList.innerHTML = '';
    buildCareList(r).forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      careList.appendChild(li);
    });

    const branch = BRANCHES[r.branch];
    $('branch-line').textContent = `Cẩm nang 7 ngày phù hợp: Nhánh ${r.branch} – ${branch.ten}`;
    $('branch-product').textContent = `Sản phẩm trọng tâm: ${branch.san_pham}`;
  }

  // Mục 7 - Hành trình 7 ngày
  function renderJourney(r) {
    const branch = BRANCHES[r.branch];
    $('journey-branch-line').textContent = `Nhánh ${r.branch} – ${branch.ten}, chọn theo chỉ số cần ưu tiên nhất của bạn.`;

    const strip = $('day-strip');
    strip.innerHTML = '';
    for (let d = 1; d <= 7; d++) {
      const chip = document.createElement('div');
      chip.className = 'day-chip' + (d === 1 ? ' open' : '');
      chip.textContent = d === 1 ? '01' : '🔒';
      strip.appendChild(chip);
    }

    $('day1-title').textContent = branch.day1.tieu_de;
    $('day1-explain').textContent = branch.day1.giai_thich;
    $('day1-suggestion').textContent = branch.day1.goi_y;
    $('day1-tip').textContent = branch.day1.tip;

    const checklist = $('day1-checklist');
    checklist.innerHTML = '';
    branch.day1.viec_hom_nay.forEach((viec, idx) => {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'day1-task-' + idx;
      cb.addEventListener('change', () => {
        li.classList.toggle('done', cb.checked);
        if (cb.checked) {
          if (!state.checklistDone.includes(idx)) state.checklistDone.push(idx);
        } else {
          state.checklistDone = state.checklistDone.filter((i) => i !== idx);
        }
        $('day-complete-msg').classList.toggle('show', state.checklistDone.length === branch.day1.viec_hom_nay.length);
      });
      const span = document.createElement('span');
      span.textContent = viec;
      li.appendChild(cb);
      li.appendChild(span);
      li.addEventListener('click', (evt) => {
        if (evt.target !== cb) cb.click();
      });
      checklist.appendChild(li);
    });
    $('day-complete-msg').classList.remove('show');

    const lockedList = $('locked-days-list');
    lockedList.innerHTML = '';
    branch.days2_7.forEach((titleText) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="lock-icon" aria-hidden="true">🔒</span><span>${titleText}</span>`;
      lockedList.appendChild(li);
    });
  }

  $('btn-unlock-scroll').addEventListener('click', () => {
    $('funnel-block').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  // ================= Mục 9 - Phễu thu thông tin =================
  function resetFunnel() {
    $('funnel-choice').classList.remove('hidden');
    $('funnel-messenger').classList.add('hidden');
    $('funnel-form').classList.add('hidden');
    $('funnel-confirm').classList.add('hidden');
    $('funnel-form').reset();
    document.querySelectorAll('.timeslot-btn').forEach((b) => b.classList.remove('selected'));
    document.querySelectorAll('#funnel-form .field').forEach((f) => f.classList.remove('invalid'));
    $('form-network-error').style.display = 'none';
  }

  $('btn-choice-messenger').addEventListener('click', () => {
    const r = state.result;
    const msg = `Chào MIYOUNG, mình vừa soi da. Mã kết quả: ${r.maKetQua} (Nhánh ${r.branch})\nMình muốn mở khóa cẩm nang ngày 2–7 và được tư vấn.`;
    $('messenger-msg-box').textContent = msg;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(() => {});
    }
    $('funnel-choice').classList.add('hidden');
    $('funnel-messenger').classList.remove('hidden');
  });

  $('btn-open-messenger').addEventListener('click', () => {
    window.open(CONFIG.MESSENGER_URL, '_blank', 'noopener');
  });

  $('btn-messenger-back').addEventListener('click', resetFunnel);
  $('btn-form-back').addEventListener('click', resetFunnel);

  $('btn-choice-call').addEventListener('click', () => {
    $('funnel-choice').classList.add('hidden');
    $('funnel-form').classList.remove('hidden');
  });

  document.querySelectorAll('.timeslot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeslot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      $('field-khung-gio').classList.remove('invalid');
    });
  });

  function normalizePhoneClient(input) {
    const stripped = String(input || '').replace(/[\s.\-]/g, '');
    const m = /^(0|\+84)(3|5|7|8|9)\d{8}$/.exec(stripped);
    if (!m) return null;
    return '0' + stripped.slice(m[1].length);
  }

  $('funnel-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    let valid = true;
    const selectedSlotBtn = document.querySelector('.timeslot-btn.selected');
    const phone = normalizePhoneClient($('input-phone').value);
    const dongYTuVan = $('chk-dongy-tuvan').checked;
    const du16 = $('chk-du16').checked;

    document.querySelectorAll('#funnel-form .field').forEach((f) => f.classList.remove('invalid'));
    $('error-dongy-tuvan').style.display = 'none';
    $('error-du16').style.display = 'none';

    if (!phone) { $('field-phone').classList.add('invalid'); valid = false; }
    if (!selectedSlotBtn) { $('field-khung-gio').classList.add('invalid'); valid = false; }
    if (!dongYTuVan) { $('error-dongy-tuvan').style.display = 'block'; valid = false; }
    if (!du16) { $('error-du16').style.display = 'block'; valid = false; }

    if (!valid) return;

    const khungGio = selectedSlotBtn.dataset.value;
    const r = state.result;
    const nhanUuDai = $('chk-uu-dai').checked;
    const tenGoi = $('input-ten').value.trim().slice(0, 40) || null;
    const thoiDiem = new Date().toISOString();

    const payload = {
      ten_goi: tenGoi,
      so_dien_thoai: phone,
      khung_gio_goi: khungGio,
      ma_ket_qua: r.maKetQua,
      nhanh_cam_nang: r.branch,
      dong_y: {
        thoi_diem: thoiDiem,
        phien_ban_thong_bao: CONFIG.NOTICE_VERSION,
        muc_dich: { goi_tu_van_va_gui_cam_nang: true, nhan_uu_dai: nhanUuDai },
        khung_gio_da_thoa_thuan: TIMESLOT_LABELS[khungGio],
        xac_nhan_du_16_tuoi: true,
        kenh: 'landing Soi Da MIYOUNG',
      },
    };

    state.isSubmitting = true;
    const submitBtn = $('btn-submit-form');
    submitBtn.disabled = true;
    $('form-network-error').style.display = 'none';

    if (!CONFIG.WEBHOOK_URL) {
      // Chế độ demo - không gửi dữ liệu đi đâu
      showConfirm(payload);
      state.isSubmitting = false;
      submitBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        $('form-network-error').textContent = body.error || 'Chưa gửi được yêu cầu. Kiểm tra kết nối và thử lại.';
        $('form-network-error').style.display = 'block';
        state.isSubmitting = false;
        submitBtn.disabled = false;
        return;
      }
      showConfirm(payload);
    } catch (err) {
      $('form-network-error').textContent = 'Chưa gửi được yêu cầu. Kiểm tra kết nối và thử lại.';
      $('form-network-error').style.display = 'block';
    }
    state.isSubmitting = false;
    submitBtn.disabled = false;
  });

  // Mục 9.5 - Màn hình xác nhận
  function showConfirm(payload) {
    $('funnel-form').classList.add('hidden');
    $('funnel-confirm').classList.remove('hidden');

    $('confirm-text').textContent = `Chuyên viên MIYOUNG sẽ gọi bạn trong khung ${payload.dong_y.khung_gio_da_thoa_thuan} và gửi cẩm nang 7 ngày Nhánh ${payload.nhanh_cam_nang} qua tin nhắn.`;

    const formattedTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payload.dong_y.thoi_diem));
    const record = $('consent-record');
    record.innerHTML = '';
    const rows = [
      ['Thời điểm', formattedTime],
      ['Phiên bản thông báo', payload.dong_y.phien_ban_thong_bao],
      ['Gọi tư vấn và gửi cẩm nang', payload.dong_y.muc_dich.goi_tu_van_va_gui_cam_nang ? 'Đồng ý' : 'Không đồng ý'],
      ['Nhận thông tin ưu đãi', payload.dong_y.muc_dich.nhan_uu_dai ? 'Đồng ý' : 'Không đồng ý'],
    ];
    rows.forEach(([label, value]) => {
      const div = document.createElement('div');
      div.textContent = `${label}: ${value}`;
      record.appendChild(div);
    });
  }

  // ================= Mục 8 - File PDF cá nhân =================
  async function ensureFontsLoaded() {
    if (!document.fonts) return;
    try {
      await Promise.all([
        document.fonts.load('400 16px "Be Vietnam Pro"'),
        document.fonts.load('600 16px "Be Vietnam Pro"'),
        document.fonts.load('700 16px "Be Vietnam Pro"'),
      ]);
      await document.fonts.ready;
    } catch (e) { /* dùng font dự phòng nếu tải lỗi */ }
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, curY);
        line = words[i] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    return curY + lineHeight;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const PDF_COLORS = {
    ink: '#1A1A1A', inkMuted: '#5B5B5B', wash: '#EAF7F1', mint: '#9ED9C3', mintDeep: '#2F8A72',
    gold: '#D8AE4B', goldSoft: '#FBF3DC', goldInk: '#7A5A12', line: '#DCEFE7', white: '#FFFFFF',
  };

  function drawFaceDiagram(ctx, cx, cy, size, r) {
    const s = size / 200;
    ctx.save();
    ctx.translate(cx - 100 * s, cy - 120 * s);
    ctx.scale(s, s);
    ctx.fillStyle = PDF_COLORS.wash;
    ctx.strokeStyle = PDF_COLORS.mintDeep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 20);
    ctx.bezierCurveTo(150, 20, 172, 62, 170, 112);
    ctx.bezierCurveTo(168, 170, 138, 214, 100, 222);
    ctx.bezierCurveTo(62, 214, 32, 170, 30, 112);
    ctx.bezierCurveTo(28, 62, 50, 20, 100, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const opa = [0.2, 0.55, 0.9];
    ctx.fillStyle = PDF_COLORS.mint;
    ctx.globalAlpha = opa[r.eL];
    ctx.beginPath(); ctx.ellipse(100, 70, 46, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = opa[r.sL];
    ctx.beginPath(); ctx.ellipse(62, 138, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(138, 138, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = opa[r.mL];
    ctx.beginPath(); ctx.ellipse(100, 196, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBar(ctx, x, y, w, h, pct, label, sub) {
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '600 26px "Be Vietnam Pro"';
    ctx.fillText(label, x, y - 14);
    ctx.fillStyle = PDF_COLORS.inkMuted;
    ctx.font = '400 22px "Be Vietnam Pro"';
    ctx.textAlign = 'right';
    ctx.fillText(sub, x + w, y - 14);
    ctx.textAlign = 'left';

    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = PDF_COLORS.wash;
    ctx.fill();
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, PDF_COLORS.gold);
    grad.addColorStop(1, PDF_COLORS.mint);
    roundRectPath(ctx, x, y, Math.max(h, w * pct / 100), h, h / 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawPage1(canvas, r, careList, priorityText) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = PDF_COLORS.white;
    ctx.fillRect(0, 0, W, H);

    // Dải mint trên cùng + đoạn vàng bên trái (mục 8.1)
    ctx.fillStyle = PDF_COLORS.wash;
    ctx.fillRect(0, 0, W, 130);
    ctx.fillStyle = PDF_COLORS.gold;
    ctx.fillRect(0, 0, 16, 130);
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '700 34px "Be Vietnam Pro"';
    ctx.fillText('MIYOUNG COSMETIC & LAB', 56, 62);
    ctx.font = '400 24px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    const today = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    ctx.fillText(`Ngày soi: ${today}`, 56, 104);

    // Tiêu đề
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '700 58px "Be Vietnam Pro"';
    ctx.fillText('Bản đồ Sáng Da', 56, 220);
    ctx.font = '400 34px "Be Vietnam Pro"';
    ctx.fillText('của bạn', 56, 264);

    // Mã kết quả
    roundRectPath(ctx, W - 380, 170, 324, 116, 20);
    ctx.fillStyle = PDF_COLORS.goldSoft;
    ctx.fill();
    ctx.strokeStyle = PDF_COLORS.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = PDF_COLORS.goldInk;
    ctx.font = '600 20px "Be Vietnam Pro"';
    ctx.fillText('MÃ KẾT QUẢ', W - 356, 210);
    ctx.font = '700 44px "Be Vietnam Pro"';
    ctx.fillText(r.maKetQua, W - 356, 260);

    // Khuôn mặt + nhãn
    drawFaceDiagram(ctx, 220, 460, 260, r);
    ctx.font = '600 24px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    const labelX = 440;
    ctx.fillText(`Trán – Độ đều màu: ${LEVEL_LABELS.even[r.eL]}`, labelX, 380);
    ctx.fillText(`Hai má – Vùng thâm sạm: ${LEVEL_LABELS.spots[r.sL]}`, labelX, 430);
    ctx.fillText(`Cằm – Độ ẩm: ${LEVEL_LABELS.moist[r.mL]}`, labelX, 480);
    ctx.font = '400 20px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    let yy = wrapCanvasText(ctx, 'Vùng càng đậm càng cần chăm sóc nhiều hơn.', labelX, 520, 340, 28);

    // Ba chỉ số
    let barY = 650;
    ctx.font = '700 32px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.fillText('Ba chỉ số của bạn', 56, barY);
    barY += 50;
    drawBar(ctx, 56, barY, W - 112, 22, r.even, 'Độ đều màu', `${LEVEL_LABELS.even[r.eL]} · ${r.even}/100`);
    barY += 90;
    drawBar(ctx, 56, barY, W - 112, 22, 100 - r.spots, 'Độ sạch thâm sạm', `${LEVEL_LABELS.spots[r.sL]} · ${100 - r.spots}/100`);
    barY += 90;
    drawBar(ctx, 56, barY, W - 112, 22, r.moist, 'Độ ẩm', `${LEVEL_LABELS.moist[r.mL]} · ${r.moist}/100`);

    // Câu ưu tiên
    barY += 80;
    ctx.font = '600 28px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    barY = wrapCanvasText(ctx, priorityText, 56, barY, W - 112, 38);

    // Khối vàng cẩm nang
    const branch = BRANCHES[r.branch];
    const boxY = barY + 20;
    roundRectPath(ctx, 56, boxY, W - 112, 220, 20);
    ctx.fillStyle = PDF_COLORS.goldSoft;
    ctx.fill();
    ctx.fillStyle = PDF_COLORS.goldInk;
    ctx.font = '700 26px "Be Vietnam Pro"';
    ctx.fillText('CẨM NANG 7 NGÀY DÀNH CHO BẠN', 84, boxY + 46);
    ctx.font = '600 26px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.fillText(`Nhánh ${r.branch} – ${branch.ten}`, 84, boxY + 88);
    ctx.font = '400 22px "Be Vietnam Pro"';
    let py = wrapCanvasText(ctx, `Sản phẩm trọng tâm: ${branch.san_pham}`, 84, boxY + 126, W - 168, 30);
    wrapCanvasText(ctx, `Nhắn fanpage facebook.com/miyoungvn kèm mã ${r.maKetQua}, hoặc để lại số trên trang soi da để chuyên viên gửi trọn bộ cẩm nang.`, 84, py + 4, W - 168, 30);

    // Gợi ý chăm sóc
    let cy = boxY + 260;
    ctx.font = '700 30px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.fillText('Gợi ý chăm sóc', 56, cy);
    cy += 40;
    ctx.font = '400 22px "Be Vietnam Pro"';
    careList.forEach((t) => {
      cy = wrapCanvasText(ctx, '• ' + t, 56, cy, W - 112, 30) + 6;
    });

    // Chân trang
    ctx.strokeStyle = PDF_COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(56, H - 130); ctx.lineTo(W - 56, H - 130); ctx.stroke();
    ctx.font = '400 18px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    wrapCanvasText(ctx, 'Kết quả mang tính tham khảo cho việc chọn mỹ phẩm, không phải chẩn đoán y khoa và không thay thế tư vấn của bác sĩ da liễu.', 56, H - 100, W - 112, 24);
    ctx.fillText('facebook.com/miyoungvn · Hotline 090 398 88 08 · Công ty TNHH SX TM XNK Khải Minh Factory', 56, H - 32);
  }

  function drawPage2(canvas, r) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const branch = BRANCHES[r.branch];
    ctx.fillStyle = PDF_COLORS.white;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = PDF_COLORS.wash;
    ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = PDF_COLORS.gold;
    ctx.fillRect(0, 0, 16, 120);
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '700 28px "Be Vietnam Pro"';
    ctx.fillText(`CẨM NANG 7 NGÀY | NHÁNH ${r.branch} – ${branch.ten.toUpperCase()}`, 56, 56);
    ctx.font = '600 24px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.goldInk;
    ctx.fillText(r.maKetQua, 56, 96);

    ctx.fillStyle = PDF_COLORS.gold;
    ctx.font = '700 110px "Be Vietnam Pro"';
    ctx.fillText('01', 56, 300);
    ctx.font = '700 26px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    ctx.fillText('NGÀY', 56, 330);

    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '700 40px "Be Vietnam Pro"';
    let y = wrapCanvasText(ctx, branch.day1.tieu_de, 56, 400, W - 112, 48);

    ctx.font = '400 24px "Be Vietnam Pro"';
    y = wrapCanvasText(ctx, branch.day1.giai_thich, 56, y + 24, W - 112, 34) + 10;

    ctx.font = '700 28px "Be Vietnam Pro"';
    ctx.fillText('Việc hôm nay', 56, y + 30);
    y += 60;
    ctx.font = '400 24px "Be Vietnam Pro"';
    branch.day1.viec_hom_nay.forEach((viec) => {
      ctx.strokeStyle = PDF_COLORS.mintDeep;
      ctx.lineWidth = 2;
      ctx.strokeRect(56, y - 20, 20, 20);
      y = wrapCanvasText(ctx, viec, 90, y - 2, W - 150, 30) + 8;
    });

    y += 16;
    roundRectPath(ctx, 56, y, W - 112, 170, 0);
    ctx.fillStyle = PDF_COLORS.goldSoft;
    ctx.fill();
    ctx.fillStyle = PDF_COLORS.gold;
    ctx.fillRect(56, y, 8, 170);
    ctx.fillStyle = PDF_COLORS.goldInk;
    ctx.font = '700 22px "Be Vietnam Pro"';
    ctx.fillText('MIYOUNG GỢI Ý', 84, y + 40);
    ctx.font = '400 22px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.ink;
    wrapCanvasText(ctx, branch.day1.goi_y, 84, y + 76, W - 168, 30);
    y += 190;

    ctx.font = '400 20px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    y = wrapCanvasText(ctx, branch.day1.tip, 56, y, W - 112, 28) + 20;

    // Khung nét đứt ngày 2-7
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = PDF_COLORS.line;
    ctx.lineWidth = 2;
    const boxH = 60 + branch.days2_7.length * 42;
    ctx.strokeRect(56, y, W - 112, boxH);
    ctx.setLineDash([]);
    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '700 26px "Be Vietnam Pro"';
    ctx.fillText('Mở khóa ngày 2–7 và tư vấn 1:1 miễn phí', 80, y + 40);
    ctx.font = '400 22px "Be Vietnam Pro"';
    ctx.fillStyle = PDF_COLORS.inkMuted;
    branch.days2_7.forEach((t, i) => {
      ctx.fillText('🔒 ' + t, 80, y + 76 + i * 42);
    });
    y += boxH + 40;

    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = '400 22px "Be Vietnam Pro"';
    wrapCanvasText(ctx, `Nhắn fanpage facebook.com/miyoungvn kèm mã ${r.maKetQua}, hoặc để lại số trên trang soi da để chuyên viên gửi trọn bộ cẩm nang.`, 56, y, W - 112, 30);
  }

  $('btn-save-pdf').addEventListener('click', async () => {
    const btn = $('btn-save-pdf');
    btn.disabled = true;
    try {
      await ensureFontsLoaded();
      const r = state.result;
      const careList = buildCareList(r);
      const priorityText = buildPriorityText(r);

      const canvas1 = document.createElement('canvas');
      canvas1.width = 1240; canvas1.height = 1759;
      drawPage1(canvas1, r, careList, priorityText);
      const img1 = canvas1.toDataURL('image/jpeg', 0.92);

      const canvas2 = document.createElement('canvas');
      canvas2.width = 1240; canvas2.height = 1759;
      drawPage2(canvas2, r);
      const img2 = canvas2.toDataURL('image/jpeg', 0.92);

      canvas1.width = 0; canvas1.height = 0;
      canvas2.width = 0; canvas2.height = 0;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
      doc.setProperties({ title: `Bản đồ Sáng Da ${r.maKetQua}` });
      doc.addImage(img1, 'JPEG', 0, 0, 148, 210);
      doc.addPage('a5', 'portrait');
      doc.addImage(img2, 'JPEG', 0, 0, 148, 210);
      doc.save(`Ban-do-Sang-Da_${r.maKetQua}_Ngay-1.pdf`);

      setPdfMessage('Đã tạo Bản đồ Sáng Da và Ngày 1. Kiểm tra mục Tải về trên điện thoại của bạn.', false);
    } catch (err) {
      console.error(err);
      setPdfMessage('Không tạo được file. Thử lại hoặc chụp màn hình kết quả.', true);
    }
    btn.disabled = false;
  });

  function setPdfMessage(text, isError) {
    const note = document.querySelector('.pdf-note');
    note.textContent = text;
    note.style.color = isError ? '#B0432D' : '';
  }

  // ================= Soi lại từ đầu =================
  $('btn-restart').addEventListener('click', () => {
    state.answers = {};
    state.questionIndex = 0;
    state.photo = null;
    state.result = null;
    state.checklistDone = [];
    $('photo-status').textContent = '';
    resetFunnel();
    setPdfMessage('File được tạo ngay trên điện thoại của bạn và chỉ lưu trên máy bạn. MIYOUNG không nhận được file này.', false);
    renderQuestion();
    showScreen('screen-s0');
  });

  // Mục 10.4 - Rút lại đồng ý / yêu cầu xóa dữ liệu
  $('link-withdraw-consent').addEventListener('click', (e) => {
    e.preventDefault();
    const r = state.result;
    const subject = encodeURIComponent('Yêu cầu về dữ liệu cá nhân - Soi Da MIYOUNG');
    const bodyLines = [
      'Loại yêu cầu: (ví dụ: rút lại đồng ý / yêu cầu xóa dữ liệu)',
      'Số điện thoại đã đăng ký: ',
      `Mã kết quả: ${r ? r.maKetQua : ''}`,
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${CONFIG.CONTROLLER.email}?subject=${subject}&body=${body}`;
  });

  renderQuestion();
})();
