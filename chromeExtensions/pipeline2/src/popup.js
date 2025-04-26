const enableBtn = document.getElementById('enableBtn');
const disableBtn = document.getElementById('disableBtn');
const showPasswordBtn = document.getElementById('showPasswordBtn');
const setPasswordBtn = document.getElementById('setPasswordBtn');
const newPasswordInput = document.getElementById('newPassword');
const passwordSetupDiv = document.querySelector('.password-setup');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');

let storedPassword = localStorage.getItem('pyroPassword') || '';
let isEnabled = localStorage.getItem('pyroEnabled') === 'true';

const updateUI = () => {
if (isEnabled) {
    titleEl.style.color = '';
    subtitleEl.classList.add('hidden');
    enableBtn.classList.add('hidden');
    disableBtn.classList.remove('hidden');
} else {
    titleEl.style.color = 'grey';
    subtitleEl.classList.remove('hidden');
    enableBtn.classList.remove('hidden');
    disableBtn.classList.add('hidden');
}
};
updateUI();

// Define handler functions
const handleEnableClick = () => {
    isEnabled = true;
    localStorage.setItem('pyroEnabled', 'true');
    updateUI();
};

const disablePopup = () => {
    isEnabled = false;
    localStorage.setItem('pyroEnabled', 'false');
    updateUI();
};
const handleDisableClick = () => {
    
    if (!storedPassword) {
        alert('No password set. Please set a password first.');
        return;
    }
    const attempt = prompt('Enter password to disable:');
    if (attempt === storedPassword) {
        disablePopup();
    } else {
        alert('Incorrect password');
    }

};


const handleShowPasswordClick = () => {
    console.log('show password clicked');
    passwordSetupDiv.classList.toggle('hidden');
};


const handleSetPasswordClick = () => {
    const pwd = newPasswordInput.value;
    if (pwd) {
        localStorage.setItem('pyroPassword', pwd);
        storedPassword = pwd;
        alert('Password saved');
        newPasswordInput.value = '';
        passwordSetupDiv.classList.add('hidden');
    } else {
        alert('Please enter a valid password');
    }
};


// Add event listeners
enableBtn.addEventListener('click', handleEnableClick);
disableBtn.addEventListener('click', handleDisableClick);
showPasswordBtn.addEventListener('click', handleShowPasswordClick);
setPasswordBtn.addEventListener('click', handleSetPasswordClick);
