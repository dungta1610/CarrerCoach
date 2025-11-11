// Chờ cho toàn bộ nội dung HTML tải xong
document.addEventListener("DOMContentLoaded", () => {
  
  // Lấy các phần tử
  const sendBtn = document.getElementById("send");
  const promptEl = document.getElementById("prompt");
  const output = document.getElementById("output");
  
  // Các phần tử MỚI cho ghi âm
  const recordBtn = document.getElementById("recordBtn");
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  if (!sendBtn || !recordBtn) {
    console.error("Lỗi: Không tìm thấy nút.");
    return;
  }

  // --- 1. XỬ LÝ GỬI TEXT (GIỮ NGUYÊN) ---
  sendBtn.addEventListener("click", async () => {
    output.innerHTML = '<div class="card"><p>⏳ Sending text...</p></div>';
    try {
      const res = await fetch("/api/gemini", { // Endpoint cũ
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptEl.value }),
      });
      const data = await res.json();
      displayData(data); // Tách hàm hiển thị ra
    } catch (err) {
      displayError(err.message);
    }
  });

  // --- 2. XỬ LÝ GHI ÂM (MỚI) ---
  recordBtn.addEventListener("click", async () => {
    if (isRecording) {
      // Dừng ghi âm
      mediaRecorder.stop();
      isRecording = false;
      recordBtn.textContent = "🎤 Record (Click to Start)";
      recordBtn.style.backgroundColor = ""; // Reset màu
    } else {
      // Bắt đầu ghi âm
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Cấu hình media recorder
        // Trình duyệt sẽ quyết định codec, thường là webm/opus
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Reset mảng chứa audio

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          // Tạo file âm thanh
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
          
          // Gửi file lên server
          await sendAudioToServer(audioBlob);
          
          // Tắt stream micro
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.textContent = "⏹️ Stop Recording";
        recordBtn.style.backgroundColor = "#e63946"; // Màu đỏ
        
      } catch (err) {
        console.error("Lỗi khi lấy micro:", err);
        displayError("Không thể truy cập micro. Vui lòng cấp quyền.");
      }
    }
  });

  async function sendAudioToServer(audioBlob) {
    output.innerHTML = '<div class="card"><p>⏳ Processing audio...</p></div>';
    
    // Sử dụng FormData để gửi file
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const res = await fetch("/api/process-voice", { // Endpoint MỚI
        method: "POST",
        body: formData, // Không cần 'Content-Type', trình duyệt tự đặt
      });
      const data = await res.json();
      displayData(data);
    } catch (err) {
      displayError(err.message);
    }
  }

  // --- 3. CÁC HÀM HIỂN THỊ (TÁCH RA) ---
  
  function displayData(data) {
    if (data.error) {
      displayError(data.error, data.raw);
      return;
    }
    
    if (data.type === "evaluation") {
      output.innerHTML = `
        <div class="card evaluation">
          <h3>📊 Đánh giá (Evaluation)</h3>
          <p>${formatText(data.feedback)}</p>
          <h3>⭐ Điểm số (Score)</h3>
          <p><strong>${data.score} / 10</strong></p>
          <h3>💡 Gợi ý (Suggested Answer)</h3>
          <p>${formatText(data.suggested_answer)}</p>
        </div>`;
    } else if (data.type === "general_answer") {
      output.innerHTML = `
        <div class="card general-answer">
          <h3>🤖 Phản hồi từ CareerCoach</h3>
          <p>${formatText(data.response)}</p>
        </div>`;
    } else {
      output.innerHTML = `
        <div class="card error">
          <h3>Lỗi Phân tích</h3>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>`;
    }
  }

  function displayError(errorMessage, raw = "N/A") {
    output.innerHTML = `
      <div class="card error">
        <h3>Lỗi</h3>
        <p><strong>${errorMessage}</strong></p>
        <p><em>Raw: ${raw}</em></p>
      </div>`;
  }
  
  function formatText(text) {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

});