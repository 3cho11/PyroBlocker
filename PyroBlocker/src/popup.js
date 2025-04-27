// popup.js
(async function() {
    const titleEl = document.getElementById('title');
    const subtitleEl = document.getElementById('subtitle');
    const loginSection = document.getElementById('loginSection');
    const entryPassword = document.getElementById('entryPassword');
    const loginBtn = document.getElementById('loginBtn');
    const setInitialBtn = document.getElementById('setInitialBtn');
    const enableBtn = document.getElementById('enableBtn');
    const disableBtn = document.getElementById('disableBtn');
    const secondaryControls = document.getElementById('secondaryControls');

    const showWhitelistBtn = document.getElementById('showWhitelistBtn');
    const whitelistDiv = document.querySelector('.whitelist-section');
    const whitelistInput = document.getElementById('whitelistUrl');
    const whitelistBtn = document.getElementById('whitelistBtn');

    const showBlacklistBtn = document.getElementById('showBlacklistBtn');
    const blacklistDiv = document.querySelector('.blacklist-section');
    const blacklistInput = document.getElementById('blacklistUrl');
    const blacklistBtn = document.getElementById('blacklistBtn');

    const showPasswordBtn = document.getElementById('showPasswordBtn');
    const passwordSection = document.querySelector('.password-section');
    const newPasswordInput = document.getElementById('newPassword');
    const setPasswordBtn = document.getElementById('setPasswordBtn');

    let storedPassword = localStorage.getItem('pyroPassword');
    let isEnabled = localStorage.getItem('pyroEnabled') === 'true';

    function updateEnableUI() {
    // update title color based on enabled state
    titleEl.style.color = isEnabled ? '' : 'grey';
    // enable/disable buttons
    enableBtn.hidden = isEnabled;
    const unlocked = !secondaryControls.classList.contains('hidden');
    disableBtn.hidden = !(isEnabled && unlocked);
}

    function lockUI() {
    subtitleEl.textContent = '(locked)';
    subtitleEl.classList.remove('hidden');
    secondaryControls.classList.add('hidden');
    updateEnableUI();
    }

    function unlockUI() {
    loginSection.classList.add('hidden');
    subtitleEl.textContent = '';
    subtitleEl.classList.add('hidden');
    secondaryControls.classList.remove('hidden');
    updateEnableUI();
    }

    if (!storedPassword) {
    setInitialBtn.hidden = false;
    loginBtn.hidden = true;
    }
    lockUI();

    setInitialBtn.addEventListener('click', () => {
    const pwd = entryPassword.value.trim();
    if (!pwd) { alert('Enter a valid new password'); return; }
    localStorage.setItem('pyroPassword', pwd);
    storedPassword = pwd;
    alert('Password set. Please re-enter to unlock.');
    entryPassword.value = '';
    setInitialBtn.hidden = true;
    loginBtn.hidden = false;
    });

    loginBtn.addEventListener('click', () => {
    if (entryPassword.value === storedPassword) unlockUI();
    else alert('Incorrect password');
    entryPassword.value = '';
    });

    enableBtn.addEventListener('click', () => {
    isEnabled = true;
    localStorage.setItem('pyroEnabled', 'true');
    updateEnableUI();
    });

    disableBtn.addEventListener('click', async () => {
    const attempt = prompt('Enter password to disable:');
    if (attempt === storedPassword) {
        isEnabled = false;
        localStorage.setItem('pyroEnabled', 'false');
        updateEnableUI();
    } else alert('Incorrect password');
    });

    // store original labels
    [showWhitelistBtn, showBlacklistBtn, showPasswordBtn].forEach(btn => btn.dataset.orig = btn.textContent);

    // Toggle panels and update button text
    function togglePanel(activeBtn, panelDiv) {
    // Toggle the panel's hidden class
    panelDiv.classList.toggle('hidden');
    // Determine if panel is now visible
    const panelVisible = !panelDiv.classList.contains('hidden');
    // Update button text based on panel visibility
    activeBtn.textContent = panelVisible ? 'Go back' : activeBtn.dataset.orig;
    // Hide other buttons when panel is visible, show when hidden
    [showWhitelistBtn, showBlacklistBtn, showPasswordBtn].forEach(btn => {
        if (btn !== activeBtn) btn.hidden = panelVisible;
    });
    }

    showWhitelistBtn.addEventListener('click', () => togglePanel(showWhitelistBtn, whitelistDiv));
    showBlacklistBtn.addEventListener('click', () => togglePanel(showBlacklistBtn, blacklistDiv));
    showPasswordBtn.addEventListener('click', () => togglePanel(showPasswordBtn, passwordSection));

    whitelistBtn.addEventListener('click', async () => {
    const url = whitelistInput.value.trim();
    if (!url) { alert('Enter a valid URL'); return; }
    const { whitelist = [] } = await chrome.storage.local.get('whitelist');
    if (!whitelist.includes(url)) {
        whitelist.push(url);
        await chrome.storage.local.set({ whitelist });
        alert('Whitelisted: ' + url);
    } else alert('Already whitelisted');
    whitelistInput.value = '';
    });

    blacklistBtn.addEventListener('click', async () => {
    const url = blacklistInput.value.trim();
    if (!url) { alert('Enter a valid URL'); return; }
    const { blacklist = [] } = await chrome.storage.local.get('blacklist');
    if (!blacklist.includes(url)) {
        blacklist.push(url);
        await chrome.storage.local.set({ blacklist });
        alert('Blacklisted: ' + url);
    } else alert('Already blacklisted');
    blacklistInput.value = '';
    });
})();