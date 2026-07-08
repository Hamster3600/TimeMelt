export function setupModals() {
    // Add website modal
    const addModal = document.getElementById('addWebsiteModal');
    const closeBtn = document.getElementById('closeAddWebsiteModalButton');
    const input = document.getElementById('newWebsiteInput');
    const msg = document.getElementById('modalMessage');
    (document.getElementById("addWebsiteButton")).addEventListener('click', () => {
        addModal.style.display = 'block';
        input.value = '';
        msg.textContent = '';
        input.focus();
    });
    closeBtn.addEventListener('click', () => { addModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === addModal)
        addModal.style.display = 'none'; });
    // Alert modal
    const alertModal = document.getElementById('alertModal');
    const alertClose = document.getElementById('closeAlertModalButton');
    const alertOk = document.getElementById('confirmAlertButton');
    alertClose.addEventListener('click', () => { alertModal.style.display = 'none'; });
    alertOk.addEventListener('click', () => { alertModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === alertModal)
        alertModal.style.display = 'none'; });
}
export function showMessage(element, text, isError) {
    element.textContent = text;
    element.className = isError ? 'text-[#dc3545] font-bold mt-[15px] text-sm' : 'text-[#28a745] font-bold mt-[15px] text-sm';
}
