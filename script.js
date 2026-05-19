function switchView(viewId) {
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('view-' + viewId).classList.add('active');
        }