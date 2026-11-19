document.addEventListener('DOMContentLoaded', () => {
    const canvasBox = document.getElementById("canvasBox");
    const resetBtn = document.getElementById("resetBtn");
    const saveBtn = document.getElementById("saveBtn");

    let selectedEl = null;

    // ================= 1. 添加素材 =================
    document.querySelectorAll(".material-item").forEach((item) => {
        item.addEventListener("click", () => {
            const src = item.dataset.src;
            const img = document.createElement("img");
            img.src = src;
            img.className = "canvas-item";

            // 初始化 transform 数据属性
            const maxX = canvasBox.clientWidth - 80;
            const maxY = canvasBox.clientHeight - 80;
            const randomX = Math.max(0, Math.floor(Math.random() * maxX));
            const randomY = Math.max(0, Math.floor(Math.random() * maxY));

            img.setAttribute('data-x', randomX);
            img.setAttribute('data-y', randomY);
            img.setAttribute('data-scale', 1);
            img.setAttribute('data-angle', 0);

            // 使用 transform 进行定位（left/top 置 0）
            img.style.left = "0px";
            img.style.top = "0px";
            updateTransform(img);

            canvasBox.appendChild(img);
            selectElement(img);

            // 双击删除
            img.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                img.remove();
                if (selectedEl === img) selectedEl = null;
            });
        });
    });

    // ================= 2. 选中与取消选中 =================
    function selectElement(el) {
        if (selectedEl && selectedEl !== el) {
            selectedEl.classList.remove("active");
        }
        selectedEl = el;
        el.classList.add("active");
    }

    canvasBox.addEventListener("click", (e) => {
        if (e.target === canvasBox && selectedEl) {
            selectedEl.classList.remove("active");
            selectedEl = null;
        }
    });

    // ================= 3. 辅助函数 =================
    function getScale(el) {
        return parseFloat(el.getAttribute('data-scale')) || 1;
    }

    function getAngle(el) {
        return parseFloat(el.getAttribute('data-angle')) || 0;
    }

    function updateTransform(el) {
        const x = el.getAttribute('data-x') || 0;
        const y = el.getAttribute('data-y') || 0;
        const scale = getScale(el);
        const angle = getAngle(el);
        el.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${angle}deg)`;
    }

    // ================= 4. interact.js 核心配置 =================
    interact('.canvas-item')
        .draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: false
                })
            ],
            listeners: {
                start(event) {
                    selectElement(event.target);
                },
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                    updateTransform(target);
                }
            }
        })
        .gesturable({ // 手机端双指缩放与旋转
            listeners: {
                move(event) {
                    const target = event.target;
                    let currentScale = getScale(target) * (1 + event.ds);
                    let currentAngle = getAngle(target) + event.da;

                    currentScale = Math.max(0.2, Math.min(currentScale, 3)); // 限制缩放 0.2x ~ 3x

                    target.setAttribute('data-scale', currentScale);
                    target.setAttribute('data-angle', currentAngle);
                    updateTransform(target);
                }
            }
        });

    // ================= 5. 鼠标滚轮缩放 =================
    canvasBox.addEventListener('wheel', (e) => {
        if (!selectedEl || e.target !== selectedEl) return;
        e.preventDefault();

        let currentScale = getScale(selectedEl);
        const delta = e.deltaY > 0 ? -0.1 : 0.1; // 向下滚动缩小，向上滚动放大
        currentScale = Math.max(0.2, Math.min(currentScale + delta, 3));

        selectedEl.setAttribute('data-scale', currentScale);
        updateTransform(selectedEl);
    }, { passive: false });

    // ================= 6. 鼠标右键旋转 =================
    canvasBox.addEventListener('contextmenu', (e) => {
        if (!selectedEl || e.target !== selectedEl) return;
        e.preventDefault();

        let currentAngle = getAngle(selectedEl);
        currentAngle += 45; // 每次点击旋转45度

        selectedEl.setAttribute('data-angle', currentAngle);
        updateTransform(selectedEl);
    });

    // ================= 7. 重置与保存 =================
    resetBtn.addEventListener("click", () => {
        canvasBox.innerHTML = "";
        selectedEl = null;
    });

    saveBtn.addEventListener("click", async () => {
        if (selectedEl) selectedEl.classList.remove("active");
        
        // 保存前暂时清除所有控制框
        document.querySelectorAll('.canvas-item').forEach(item => item.classList.remove('active'));

        const canvas = await html2canvas(canvasBox, {
            backgroundColor: "#fff9ef",
            scale: 2,
            useCORS: true
        });

        const link = document.createElement("a");
        link.download = "我的簪花.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
});

const options = document.querySelectorAll('.option');
const resetBtn = document.querySelector('.reset-btn');

options.forEach(opt => {
  opt.addEventListener('click', function() {
    // 优化：使用 closest 向上寻找最近的 .question 容器，防止结构修改导致报错
    const qWrap = this.closest('.question');
    const allOpt = qWrap.querySelectorAll('.option');
    
    // 禁止二次选择
    allOpt.forEach(o => o.disabled = true);
    
    // 上色与判断
    if (this.dataset.ans === "right") {
      this.classList.add('right');
      qWrap.querySelector('.result-text').innerText = "✅回答正确！";
    } else {
      this.classList.add('wrong');
      // 找出正确答案并高亮
      allOpt.forEach(o => {
        if (o.dataset.ans === "right") o.classList.add('right');
      });
      qWrap.querySelector('.result-text').innerText = "❌不对哦，看正确答案。";
    }
  });
});

resetBtn.addEventListener('click', () => {
  document.querySelectorAll('.option').forEach(o => {
    o.classList.remove('right', 'wrong');
    o.disabled = false;
  });
  document.querySelectorAll('.result-text').forEach(t => t.innerText = "");
});