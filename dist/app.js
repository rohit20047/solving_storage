const baseUrl = '.netlify/functions'; // Update base URL for Netlify Functions
const fileInput = document.querySelector('#fileInput');
const uploadBtn = document.querySelector('#uploadBtn');
const progressBar = document.getElementById('progressBar');
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file');
    return;
  }
  
  uploadFileInChunks(file);
});

async function uploadFileInChunks(file) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedChunks = 0;

  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const chunk = file.slice(start, start + CHUNK_SIZE);
    const chunkFormData = new FormData();
    chunkFormData.append('file', chunk);
    chunkFormData.append('filename', file.name);
    chunkFormData.append('chunkIndex', Math.floor(start / CHUNK_SIZE));

    try {
      await uploadChunk(chunkFormData);
      uploadedChunks++;
      updateProgressBar((uploadedChunks / totalChunks) * 100);
    } catch (error) {
      console.error('Error uploading chunk:', error);
      alert('Failed to upload file. Please try again.');
      return;
    }
  }

  alert('File uploaded successfully');
}

async function uploadChunk(formData) {
  const response = await fetch(`${baseUrl}/upload_parallel`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error uploading chunk: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error('Server error during upload');
  }

  return result;
}

function updateProgressBar(percent) {
  progressBar.style.width = `${percent}%`;
  progressBar.innerText = `${Math.round(percent)}%`;
}
