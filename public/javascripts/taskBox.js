
// Handle Task Creation
document.getElementById('createTaskForm').addEventListener('submit', e => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Get task details
  const taskName = formData.get('taskName');
  const taskDesc = formData.get('taskDesc');
  const year = formData.get('year');
  const dept = formData.get('dept');
  const deadline = formData.get('deadline');

  // Get the uploaded ZIP file
  const zipFile = formData.get('taskZip'); // File object
  const zipFileName = zipFile ? zipFile.name : "No file attached";

  // Log all info
  console.log("Task Name:", taskName);
  console.log("Description:", taskDesc);
  console.log("Year:", year);
  console.log("Department:", dept);
  console.log("Deadline:", deadline);
  console.log("Attached ZIP file:", zipFileName);

  console.log("Task Created:", Object.fromEntries(formData.entries()));
  alert("Task created successfully (demo only)");

  // Reset form and file display
  form.reset();
  fileNameDisplay.textContent = "No file selected";
});
