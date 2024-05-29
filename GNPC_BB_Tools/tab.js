// tab.js
document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab');

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            tabContents.forEach((content) => {
                content.style.display = 'none';
            });

            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            tabContent.style.display = 'block';
        });
    });

    tabButtons[0].click();
});
