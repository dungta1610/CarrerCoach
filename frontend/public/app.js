// Chờ cho toàn bộ nội dung HTML tải xong rồi mới chạy JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Lấy các phần tử
  const sendBtn = document.getElementById("send");
  const promptEl = document.getElementById("prompt");
  const output = document.getElementById("output");
  const recordBtn = document.getElementById("recordBtn");

  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  // --- 1. THIẾT LẬP WEB SPEECH API (MỚI) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;

  // Kiểm tra xem trình duyệt có hỗ trợ không
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Cho phép nói liên tục
    recognition.interimResults = true; // Hiển thị kết quả "tạm thời"
    recognition.lang = "vi-VN"; // Đặt ngôn ngữ (hoặc "en-US")

    // Sự kiện này chạy MỖI KHI có kết quả (kể cả tạm thời)
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Cập nhật text box real-time!
      promptEl.value = finalTranscript + interimTranscript;
    };

    // Xử lý lỗi
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        displayError("Không thể dùng micro.", "Bạn đã chặn quyền truy cập micro. Hãy reset quyền ở thanh địa chỉ.");
      }
    };

  } else {
    console.warn("Web Speech API không được hỗ trợ trên trình duyệt này.");
  }
  // --- KẾT THÚC THIẾT LẬP ---

  
  // --- 2. XỬ LÝ NÚT GỬI TEXT (Giữ nguyên) ---
  sendBtn.addEventListener("click", async () => {
    output.innerHTML = '<div class="card"><p>⏳ Sending text...</p></div>';
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptEl.value }),
      });
      const data = await res.json();
      displayData(data);
    } catch (err) {
      displayError(err.message);
    }
  });


  // --- 3. XỬ LÝ NÚT GHI ÂM (Cập nhật) ---
  recordBtn.addEventListener("click", async () => {
    if (isRecording) {
      // --- DỪNG GHI ÂM ---
      if (mediaRecorder) {
        mediaRecorder.stop(); // Dừng ghi âm file (luồng 2)
      }
      if (recognition) {
        recognition.stop(); // Dừng nhận diện giọng nói (luồng 1)
      }
      
      isRecording = false;
      recordBtn.textContent = "🎤 Record (Click to Start)";
      recordBtn.style.backgroundColor = "";

    } else {
      // --- BẮT ĐẦU GHI ÂM ---
      if (!SpeechRecognition) {
        displayError("Trình duyệt không hỗ trợ.", "Tính năng ghi âm real-time chỉ hoạt động trên Chrome, Edge, hoặc Safari.");
        return;
      }

      try {
        // Yêu cầu quyền micro
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // --- Bắt đầu Luồng 1: Nhận diện real-time ---
        promptEl.value = ""; // Xóa text cũ
        promptEl.placeholder = "Đang nghe... Vui lòng nói vào micro.";
        recognition.start();

        // --- Bắt đầu Luồng 2: Ghi âm file audio ---
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
        audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        // Khi dừng, file audio sẽ được gửi đi
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
          await sendAudioToServer(audioBlob); // Gửi file đi
          stream.getTracks().forEach(track => track.stop()); // Tắt micro
        };

        mediaRecorder.start();

        isRecording = true;
        recordBtn.textContent = "⏹️ Stop Recording";
        recordBtn.style.backgroundColor = "#e63946";
        
      } catch (err) {
        // Lỗi này chủ yếu xảy ra khi người dùng chặn micro
        console.error("Lỗi khi lấy micro:", err);
        displayError("Không thể truy cập micro.", "Vui lòng cấp quyền micro cho trang web này.");
      }
    }
  });

  // --- 4. HÀM GỬI AUDIO (Giữ nguyên) ---
  async function sendAudioToServer(audioBlob) {
    output.innerHTML = '<div class="card"><p>⏳ Đang xử lý âm thanh (Speech-to-Text)...</p></div>';
    
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const res = await fetch("/api/process-voice", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      // Hiển thị text đã nhận diện từ backend (để so sánh)
      // promptEl.value = data.transcribed_text; // (Optional)
      
      displayData(data);
    } catch (err) {
      displayError(err.message);
    }
  }

  // --- 5. CÁC HÀM HIỂN THỊ (Giữ nguyên) ---
  function displayData(data) {
    promptEl.placeholder = ""; // Reset placeholder
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
    promptEl.placeholder = ""; // Reset placeholder
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

}); // <-- Đóng hàm DOMContentLoaded