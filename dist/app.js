const baseUrl = '.netlify/functions';
const fileInput = document.querySelector('#fileInput');
const customNameInput = document.querySelector('#customNameInput'); // New input for custom name
const uploadBtn = document.querySelector('#uploadBtn');
const progressBar = document.getElementById('progressBar');
const CHUNK_SIZE = 2 * 1024 * 1024;
const fileLinkDiv = document.getElementById('fileLinkDiv');

uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  const customName = customNameInput.value.trim(); // Get custom name
  if (!file) {
    alert('Please select a file');
    return;
  }
  if (!customName) {
    alert('Please enter a custom name for the file');
    return;
  }
  uploadFileInChunks(file, customName);
});

async function uploadFileInChunks(file, customName) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedChunks = 0;

  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const chunk = file.slice(start, start + CHUNK_SIZE);
    const chunkFormData = new FormData();
    chunkFormData.append('file', chunk);
    chunkFormData.append('filename', customName + '.pdf'); // Use custom name
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

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error uploading chunk: ${response.statusText}`);
  } else {
    console.log("result", result);
    fileLinkDiv.innerHTML = `${result.data}`;
  }

  if (!result.success) {
    throw new Error('Server error during upload');
  }
}

function updateProgressBar(percent) {
  progressBar.style.width = `${percent}%`;
  progressBar.innerText = `${Math.round(percent)}%`;
}