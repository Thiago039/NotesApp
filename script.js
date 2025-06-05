document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const sidebar = document.querySelector('.sidebar');
  const themeToggle = document.getElementById('themeToggle');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const noteModal = document.getElementById('noteModal');
  const closeModal = document.getElementById('closeModal');
  const saveNoteBtn = document.getElementById('saveNote');
  const cancelNoteBtn = document.getElementById('cancelNote');
  const notesContainer = document.getElementById('notesContainer');
  const categoryList = document.getElementById('categoryList');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const searchInput = document.getElementById('searchInput');
  const currentCategoryTitle = document.getElementById('currentCategory');
  const noteCountElement = document.getElementById('noteCount');
  const viewNoteModal = document.getElementById('viewNoteModal');
  const closeViewModal = document.getElementById('closeViewModal');
  const editNoteBtn = document.getElementById('editNoteBtn');
  const deleteNoteBtn = document.getElementById('deleteNoteBtn');
  const confirmModal = document.getElementById('confirmModal');
  const closeConfirmModal = document.getElementById('closeConfirmModal');
  const confirmActionBtn = document.getElementById('confirmAction');
  const cancelActionBtn = document.getElementById('cancelAction');
  const exportBtn = document.getElementById('exportBtn');
  const importFileInput = document.getElementById('importFile');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  
  // State
  let notes = JSON.parse(localStorage.getItem('notesData')) || [];
  let categories = JSON.parse(localStorage.getItem('notesCategories')) || ['commands', 'concepts', 'tutorials', 'tips'];
  let categoryColors = JSON.parse(localStorage.getItem('notesCategoryColors')) || {};
  let currentCategory = 'all';
  let currentNoteId = null;
  let deleteNoteId = null;
  let deleteCategoryName = null;
  
  // Default category colors
  const defaultColors = {
    'commands': '#4caf50',
    'concepts': '#2196f3',
    'tutorials': '#ff9800',
    'tips': '#9c27b0'
  };
  
  // Available colors for categories
  const availableColors = [
    '#4caf50', // Green
    '#2196f3', // Blue
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#e91e63', // Pink
    '#f44336', // Red
    '#009688', // Teal
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#795548', // Brown
    '#607d8b', // Blue Grey
    '#ff5722'  // Deep Orange
  ];
  
  // Initialize
  initializeApp();
  
  // Event Listeners
  toggleSidebarBtn.addEventListener('click', toggleSidebar);
  themeToggle.addEventListener('click', toggleTheme);
  addNoteBtn.addEventListener('click', openAddNoteModal);
  closeModal.addEventListener('click', closeNoteModal);
  saveNoteBtn.addEventListener('click', saveNote);
  cancelNoteBtn.addEventListener('click', closeNoteModal);
  addCategoryBtn.addEventListener('click', addCategory);
  searchInput.addEventListener('input', searchNotes);
  closeViewModal.addEventListener('click', closeViewNoteModal);
  editNoteBtn.addEventListener('click', editCurrentNote);
  deleteNoteBtn.addEventListener('click', confirmDeleteNote);
  closeConfirmModal.addEventListener('click', closeConfirmationModal);
  confirmActionBtn.addEventListener('click', handleConfirmAction);
  cancelActionBtn.addEventListener('click', closeConfirmationModal);
  exportBtn.addEventListener('click', exportNotes);
  importFileInput.addEventListener('change', importNotes);
  copyCodeBtn.addEventListener('click', copyCodeToClipboard);
  
  // Functions
  function initializeApp() {
    // Initialize category colors if not set
    categories.forEach(category => {
      if (!categoryColors[category]) {
        categoryColors[category] = defaultColors[category] || getRandomColor();
      }
    });
    
    // Save category colors
    localStorage.setItem('notesCategoryColors', JSON.stringify(categoryColors));
    
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Update app title
    const appTitle = document.querySelector('.logo h1');
    if (appTitle) {
      appTitle.textContent = 'NotesApp';
    }
    
    // Initialize categories
    updateCategoryList();
    
    // Load notes
    renderNotes();
    
    // Add click event to category items
    document.querySelectorAll('#categoryList li').forEach(item => {
      item.addEventListener('click', function(e) {
        // If clicked on delete button, don't filter
        if (e.target.classList.contains('category-delete')) {
          return;
        }
        filterByCategory(this.dataset.category);
      });
    });
  }
  
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('active');
    }
  }
  
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }
  
  function openAddNoteModal() {
    document.getElementById('modalTitle').textContent = 'Nova Nota';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteCode').value = '';
    
    // Update category select options
    const categorySelect = document.getElementById('noteCategory');
    categorySelect.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = capitalizeFirstLetter(category);
      categorySelect.appendChild(option);
    });
    
    noteModal.classList.add('active');
    document.getElementById('noteTitle').focus();
  }
  
  function closeNoteModal() {
    noteModal.classList.remove('active');
    currentNoteId = null;
  }
  
  function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const category = document.getElementById('noteCategory').value;
    const content = document.getElementById('noteContent').value.trim();
    const code = document.getElementById('noteCode').value.trim();
    
    if (!title) {
      showToast('Por favor, adicione um título para a nota.', 'error');
      return;
    }
    
    if (!content) {
      showToast('Por favor, adicione algum conteúdo para a nota.', 'error');
      return;
    }
    
    const timestamp = new Date().toISOString();
    
    if (currentNoteId !== null) {
      // Edit existing note
      const noteIndex = notes.findIndex(note => note.id === currentNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          title,
          category,
          content,
          code,
          updatedAt: timestamp
        };
        showToast('Nota atualizada com sucesso!');
      }
    } else {
      // Add new note
      const newNote = {
        id: generateId(),
        title,
        category,
        content,
        code,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      notes.unshift(newNote);
      showToast('Nota adicionada com sucesso!');
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Close modal and render notes
    closeNoteModal();
    renderNotes();
  }
  
  function renderNotes() {
    let filteredNotes = notes;
    
    // Filter by category if not 'all'
    if (currentCategory !== 'all') {
      filteredNotes = notes.filter(note => note.category === currentCategory);
    }
    
    // Filter by search term if exists
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm) ||
        (note.code && note.code.toLowerCase().includes(searchTerm))
      );
    }
    
    // Update note count
    noteCountElement.textContent = `${filteredNotes.length} nota${filteredNotes.length !== 1 ? 's' : ''}`;
    
    // Clear container
    notesContainer.innerHTML = '';
    
    if (filteredNotes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <i class="fas fa-book-open"></i>
        <p>${searchTerm ? 'Nenhuma nota encontrada para esta pesquisa.' : 'Nenhuma nota encontrada. Crie uma nova nota para começar!'}</p>
      `;
      notesContainer.appendChild(emptyState);
      return;
    }
    
    // Render notes
    filteredNotes.forEach(note => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      noteCard.dataset.id = note.id;
      noteCard.dataset.category = note.category;
      
      // Apply category color
      const categoryColor = categoryColors[note.category] || getRandomColor();
      noteCard.style.setProperty('--category-color', categoryColor);
      
      const date = new Date(note.updatedAt);
      const formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
      
      noteCard.innerHTML = `
        <h3>${escapeHTML(note.title)}</h3>
        <div class="note-preview">${escapeHTML(note.content)}</div>
        <div class="note-footer">
          <span class="note-category" style="background-color: ${getCategoryBgColor(note.category)}; color: ${getCategoryTextColor(note.category)}">
            ${capitalizeFirstLetter(note.category)}
          </span>
          <span class="note-date">${formattedDate}</span>
        </div>
      `;
      
      // Set the category color for the left border
      noteCard.style.setProperty('--category-color', categoryColor);
      
      noteCard.addEventListener('click', () => viewNote(note.id));
      notesContainer.appendChild(noteCard);
    });
  }
  
  function getCategoryBgColor(category) {
    const color = categoryColors[category] || getRandomColor();
    return `${color}22`; // Add transparency
  }
  
  function getCategoryTextColor(category) {
    return categoryColors[category] || getRandomColor();
  }
  
  function viewNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    currentNoteId = noteId;
    
    document.getElementById('viewNoteTitle').textContent = note.title;
    
    const categoryElement = document.getElementById('viewNoteCategory');
    categoryElement.textContent = capitalizeFirstLetter(note.category);
    categoryElement.dataset.category = note.category;
    categoryElement.style.backgroundColor = getCategoryBgColor(note.category);
    categoryElement.style.color = getCategoryTextColor(note.category);
    
    const date = new Date(note.updatedAt);
    document.getElementById('viewNoteDate').textContent = `Atualizado em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    
    document.getElementById('viewNoteContent').textContent = note.content;
    
    const codeContainer = document.getElementById('viewNoteCodeContainer');
    const codeElement = document.getElementById('viewNoteCode');
    
    if (note.code && note.code.trim()) {
      codeElement.textContent = note.code;
      codeContainer.style.display = 'block';
    } else {
      codeContainer.style.display = 'none';
    }
    
    viewNoteModal.classList.add('active');
  }
  
  function closeViewNoteModal() {
    viewNoteModal.classList.remove('active');
  }
  
  function editCurrentNote() {
    if (!currentNoteId) return;
    
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    
    closeViewNoteModal();
    
    document.getElementById('modalTitle').textContent = 'Editar Nota';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteCode').value = note.code || '';
    
    // Update category select options
    const categorySelect = document.getElementById('noteCategory');
    categorySelect.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = capitalizeFirstLetter(category);
      if (category === note.category) {
        option.selected = true;
      }
      categorySelect.appendChild(option);
    });
    
    noteModal.classList.add('active');
  }
  
  function confirmDeleteNote() {
    deleteNoteId = currentNoteId;
    document.getElementById('confirmMessage').textContent = 'Tem certeza que deseja excluir esta nota?';
    confirmModal.classList.add('active');
    
    // Set action type
    confirmActionBtn.dataset.action = 'deleteNote';
  }
  
  function confirmDeleteCategory(categoryName) {
    deleteCategoryName = categoryName;
    
    // Count notes in this category
    const notesInCategory = notes.filter(note => note.category === categoryName).length;
    
    let message = `Tem certeza que deseja excluir a categoria "${capitalizeFirstLetter(categoryName)}"?`;
    if (notesInCategory > 0) {
      message += ` Existem ${notesInCategory} nota(s) nesta categoria que serão movidas para a categoria padrão.`;
    }
    
    document.getElementById('confirmMessage').textContent = message;
    confirmModal.classList.add('active');
    
    // Set action type
    confirmActionBtn.dataset.action = 'deleteCategory';
  }
  
  function handleConfirmAction() {
    const action = confirmActionBtn.dataset.action;
    
    if (action === 'deleteNote') {
      deleteNote();
    } else if (action === 'deleteCategory') {
      deleteCategory();
    }
    
    // Reset action type
    delete confirmActionBtn.dataset.action;
  }
  
  function deleteNote() {
    if (!deleteNoteId) return;
    
    notes = notes.filter(note => note.id !== deleteNoteId);
    saveToLocalStorage();
    renderNotes();
    
    closeConfirmationModal();
    closeViewNoteModal();
    showToast('Nota excluída com sucesso!');
  }
  
  function deleteCategory() {
    if (!deleteCategoryName || deleteCategoryName === 'all') return;
    
    // Move notes from this category to default category
    const defaultCategory = categories[0] || 'general';
    notes = notes.map(note => {
      if (note.category === deleteCategoryName) {
        return { ...note, category: defaultCategory };
      }
      return note;
    });
    
    // Remove category
    categories = categories.filter(cat => cat !== deleteCategoryName);
    
    // Remove category color
    delete categoryColors[deleteCategoryName];
    
    // Save changes
    localStorage.setItem('notesCategories', JSON.stringify(categories));
    localStorage.setItem('notesCategoryColors', JSON.stringify(categoryColors));
    saveToLocalStorage();
    
    // Update UI
    updateCategoryList();
    renderNotes();
    
    closeConfirmationModal();
    showToast(`Categoria "${capitalizeFirstLetter(deleteCategoryName)}" excluída com sucesso!`);
  }
  
  function closeConfirmationModal() {
    confirmModal.classList.remove('active');
    deleteNoteId = null;
    deleteCategoryName = null;
  }
  
  function addCategory() {
    const newCategory = newCategoryInput.value.trim().toLowerCase();
    
    if (!newCategory) {
      showToast('Por favor, digite um nome para a categoria.', 'error');
      return;
    }
    
    if (categories.includes(newCategory)) {
      showToast('Esta categoria já existe.', 'error');
      return;
    }
    
    // Add new category
    categories.push(newCategory);
    
    // Assign a color to the new category
    categoryColors[newCategory] = getRandomColor();
    
    // Save categories and colors
    localStorage.setItem('notesCategories', JSON.stringify(categories));
    localStorage.setItem('notesCategoryColors', JSON.stringify(categoryColors));
    
    updateCategoryList();
    newCategoryInput.value = '';
    showToast('Categoria adicionada com sucesso!');
  }
  
  function updateCategoryList() {
    categoryList.innerHTML = `
      <li data-category="all" class="${currentCategory === 'all' ? 'active' : ''}">Todas as Notas</li>
    `;
    
    categories.forEach(category => {
      const li = document.createElement('li');
      li.dataset.category = category;
      
      // Create category name span
      const categoryName = document.createElement('span');
      categoryName.textContent = capitalizeFirstLetter(category);
      categoryName.className = 'category-name';
      
      // Create delete button (except for default categories if needed)
      const deleteBtn = document.createElement('span');
      deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
      deleteBtn.className = 'category-delete';
      deleteBtn.title = 'Excluir categoria';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteCategory(category);
      });
      
      // Add color indicator
      const colorIndicator = document.createElement('span');
      colorIndicator.className = 'category-color';
      colorIndicator.style.backgroundColor = categoryColors[category] || getRandomColor();
      
      // Add elements to li
      li.appendChild(colorIndicator);
      li.appendChild(categoryName);
      li.appendChild(deleteBtn);
      
      if (category === currentCategory) {
        li.classList.add('active');
      }
      
      li.addEventListener('click', function(e) {
        // If clicked on delete button, don't filter
        if (e.target.classList.contains('category-delete') || e.target.closest('.category-delete')) {
          return;
        }
        filterByCategory(this.dataset.category);
      });
      
      categoryList.appendChild(li);
    });
  }
  
  function filterByCategory(category) {
    currentCategory = category;
    currentCategoryTitle.textContent = category === 'all' ? 'Todas as Notas' : capitalizeFirstLetter(category);
    
    // Update active class
    document.querySelectorAll('#categoryList li').forEach(item => {
      item.classList.toggle('active', item.dataset.category === category);
    });
    
    renderNotes();
  }
  
  function searchNotes() {
    renderNotes();
  }
  
  function exportNotes() {
    const data = {
      notes,
      categories,
      categoryColors
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!');
  }
  
  function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.notes && Array.isArray(data.notes) && 
            data.categories && Array.isArray(data.categories)) {
          // Confirm before overwriting
          document.getElementById('confirmMessage').textContent = 'Importar estes dados substituirá todas as suas notas atuais. Deseja continuar?';
          confirmModal.classList.add('active');
          
          confirmActionBtn.onclick = function() {
            notes = data.notes;
            categories = data.categories;
            categoryColors = data.categoryColors || {};
            
            // Ensure all categories have colors
            categories.forEach(category => {
              if (!categoryColors[category]) {
                categoryColors[category] = getRandomColor();
              }
            });
            
            saveToLocalStorage();
            localStorage.setItem('notesCategories', JSON.stringify(categories));
            localStorage.setItem('notesCategoryColors', JSON.stringify(categoryColors));
            
            updateCategoryList();
            renderNotes();
            closeConfirmationModal();
            showToast('Dados importados com sucesso!');
          };
        } else {
          showToast('Formato de arquivo inválido.', 'error');
        }
      } catch (error) {
        showToast('Erro ao importar dados. Verifique o formato do arquivo.', 'error');
      }
      
      // Reset file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }
  
  function copyCodeToClipboard() {
    const codeElement = document.getElementById('viewNoteCode');
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    showToast('Código copiado para a área de transferência!');
  }
  
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
      toastIcon.className = 'fas fa-times-circle error';
    } else {
      toastIcon.className = 'fas fa-check-circle';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  function saveToLocalStorage() {
    localStorage.setItem('notesData', JSON.stringify(notes));
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag]));
  }
  
  function getRandomColor() {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  
  // Add some sample notes if none exist
  if (notes.length === 0) {
    const sampleNotes = [
      {
        id: generateId(),
        title: 'Comandos Básicos do Terminal',
        category: 'commands',
        content: 'Lista dos comandos mais úteis e frequentemente usados no terminal Linux para iniciantes.',
        code: '# Navegação\nls -la    # Listar arquivos (incluindo ocultos)\ncd /path  # Mudar diretório\npwd       # Mostrar diretório atual\n\n# Manipulação de arquivos\ncp origem destino  # Copiar\nmv origem destino  # Mover/renomear\nrm arquivo         # Remover arquivo\nrm -rf diretório   # Remover diretório recursivamente\n\n# Permissões\nchmod +x arquivo   # Tornar arquivo executável\nchown user:group arquivo  # Mudar proprietário',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        title: 'Conceito de Permissões no Linux',
        category: 'concepts',
        content: 'O sistema de permissões do Linux é baseado em três tipos de acesso: leitura (r), escrita (w) e execução (x). Estas permissões são definidas para três categorias de usuários: proprietário, grupo e outros. Entender este sistema é fundamental para gerenciar a segurança em sistemas Linux.',
        code: '# Representação numérica de permissões\n# r = 4, w = 2, x = 1\n\nchmod 755 arquivo  # rwxr-xr-x\nchmod 644 arquivo  # rw-r--r--\nchmod 600 arquivo  # rw-------',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: generateId(),
        title: 'Como instalar e gerenciar pacotes com APT',
        category: 'tutorials',
        content: 'O APT (Advanced Package Tool) é o gerenciador de pacotes usado em distribuições baseadas em Debian, como Ubuntu. Este tutorial explica como usar o APT para instalar, atualizar e remover pacotes de software.',
        code: '# Atualizar lista de pacotes\nsudo apt update\n\n# Atualizar todos os pacotes\nsudo apt upgrade\n\n# Instalar um pacote\nsudo apt install nome-do-pacote\n\n# Remover um pacote\nsudo apt remove nome-do-pacote\n\n# Remover pacote e configurações\nsudo apt purge nome-do-pacote\n\n# Procurar por pacotes\napt search termo-de-busca',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    
    notes = sampleNotes;
    saveToLocalStorage();
    renderNotes();
  }
});
