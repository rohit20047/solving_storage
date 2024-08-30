const baseUrl = '.netlify/functions'; // Update base URL for Netlify Functions
const fileInput = document.querySelector('#fileInput');
const uploadBtn = document.querySelector('#uploadBtn');
const progressBar = document.getElementById('progressBar');
const CHUNK_SIZE = 2 * 1024 * 1024; // 5MB per chunk
const fileLinkDiv = document.getElementById('fileLinkDiv');


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
    
    //const MAX_FILE_SIZE = 5500 * 1024; // 1500 KB in bytes

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
  const response = await fetch(`${baseUrl}/upload_parallel`,{
    method: 'POST',
    body: formData,
});

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error uploading chunk: ${response.statusText}`);
  }
  else{
    console.log("result", result);
   
     fileLinkDiv.innerHTML = `
       <a href="${result.data}" target="_blank" class="text-blue-500 underline">${result.data} </a>`
  }

 
  if (!result.success) {
    throw new Error('Server error during upload');
  }
  


}

function updateProgressBar(percent) {
  progressBar.style.width = `${percent}%`;
  progressBar.innerText = `${Math.round(percent)}%`;
}