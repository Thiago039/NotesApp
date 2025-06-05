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
  const syncStatus = document.getElementById('syncStatus');
  
  // State
  let notes = [];
  let categories = ['commands', 'concepts', 'tutorials', 'tips'];
  let categoryColors = {};
  let currentCategory = 'all';
  let currentNoteId = null;
  let deleteNoteId = null;
  let deleteCategoryName = null;
  let currentUserId = null;
  let unsubscribeNotes = null;
  let unsubscribeCategories = null;
  
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
  
  // Make initializeApp function available globally for auth.js
  window.initializeApp = initializeUserData;
  
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
  function initializeUserData(userId) {
    currentUserId = userId;
    
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Load user data from Firestore
    loadUserData();
  }
  
  function loadUserData() {
    // Show loading state
    updateSyncStatus('loading');
    
    // Load categories
    loadCategories();
    
    // Load notes
    loadNotes();
  }
  
  function loadCategories() {
    // Unsubscribe from previous listener if exists
    if (unsubscribeCategories) {
      unsubscribeCategories();
    }
    
    // Subscribe to categories collection
    unsubscribeCategories = db.collection('users').doc(currentUserId).collection('categories')
      .doc('default')
      .onSnapshot((doc) => {
        if (doc.exists && doc.data().list) {
          categories = doc.data().list;
          
          // Load category colors
          loadCategoryColors();
          
          // Update category list in UI
          updateCategoryList();
        } else {
          // Create default categories if not exist
          db.collection('users').doc(currentUserId).collection('categories')
            .doc('default')
            .set({
              list: ['commands', 'concepts', 'tutorials', 'tips']
            });
        }
      }, (error) => {
        console.error('Error loading categories:', error);
        showToast('Erro ao carregar categorias.', 'error');
        updateSyncStatus('error');
      });
  }
  
  function loadCategoryColors() {
    db.collection('users').doc(currentUserId).collection('categoryColors')
      .doc('colors')
      .get()
      .then((doc) => {
        if (doc.exists) {
          categoryColors = doc.data();
        } else {
          // Initialize default colors
          categoryColors = {};
          categories.forEach(category => {
            categoryColors[category] = defaultColors[category] || getRandomColor();
          });
          
          // Save to Firestore
          saveCategoryColors();
        }
      })
      .catch((error) => {
        console.error('Error loading category colors:', error);
      });
  }
  
  function saveCategoryColors() {
    db.collection('users').doc(currentUserId).collection('categoryColors')
      .doc('colors')
      .set(categoryColors)
      .catch((error) => {
        console.error('Error saving category colors:', error);
      });
  }
  
  function loadNotes() {
    // Unsubscribe from previous listener if exists
    if (unsubscribeNotes) {
      unsubscribeNotes();
    }
    
    // Subscribe to notes collection
    unsubscribeNotes = db.collection('users').doc(currentUserId).collection('notes')
      .orderBy('updatedAt', 'desc')
      .onSnapshot((snapshot) => {
        notes = [];
        snapshot.forEach((doc) => {
          const note = doc.data();
          note.id = doc.id;
          notes.push(note);
        });
        
        // Update UI
        renderNotes();
        updateSyncStatus('synced');
      }, (error) => {
        console.error('Error loading notes:', error);
        showToast('Erro ao carregar notas.', 'error');
        updateSyncStatus('error');
      });
  }
  
  function updateSyncStatus(status) {
    switch (status) {
      case 'loading':
        syncStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> Carregando...';
        syncStatus.className = 'sync-status loading';
        break;
      case 'syncing':
        syncStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> Sincronizando...';
        syncStatus.className = 'sync-status syncing';
        break;
      case 'synced':
        syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Sincronizado';
        syncStatus.className = 'sync-status synced';
        break;
      case 'error':
        syncStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de sincronização';
        syncStatus.className = 'sync-status error';
        break;
      default:
        syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Sincronizado';
        syncStatus.className = 'sync-status synced';
    }
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
    
    // Show syncing status
    updateSyncStatus('syncing');
    
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    if (currentNoteId !== null) {
      // Edit existing note
      db.collection('users').doc(currentUserId).collection('notes').doc(currentNoteId)
        .update({
          title,
          category,
          content,
          code,
          updatedAt: timestamp
        })
        .then(() => {
          showToast('Nota atualizada com sucesso!');
          closeNoteModal();
        })
        .catch((error) => {
          console.error('Error updating note:', error);
          showToast('Erro ao atualizar nota.', 'error');
          updateSyncStatus('error');
        });
    } else {
      // Add new note
      db.collection('users').doc(currentUserId).collection('notes')
        .add({
          title,
          category,
          content,
          code,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .then(() => {
          showToast('Nota adicionada com sucesso!');
          closeNoteModal();
        })
        .catch((error) => {
          console.error('Error adding note:', error);
          showToast('Erro ao adicionar nota.', 'error');
          updateSyncStatus('error');
        });
    }
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
      
      // Format date
      let formattedDate = 'Carregando...';
      if (note.updatedAt && note.updatedAt.toDate) {
        const date = note.updatedAt.toDate();
        formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
      }
      
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
    
    // Format date
    let formattedDate = 'Carregando...';
    if (note.updatedAt && note.updatedAt.toDate) {
      const date = note.updatedAt.toDate();
      formattedDate = `Atualizado em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    }
    document.getElementById('viewNoteDate').textContent = formattedDate;
    
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
    
    // Show syncing status
    updateSyncStatus('syncing');
    
    db.collection('users').doc(currentUserId).collection('notes').doc(deleteNoteId)
      .delete()
      .then(() => {
        closeConfirmationModal();
        closeViewNoteModal();
        showToast('Nota excluída com sucesso!');
      })
      .catch((error) => {
        console.error('Error deleting note:', error);
        showToast('Erro ao excluir nota.', 'error');
        updateSyncStatus('error');
      });
  }
  
  function deleteCategory() {
    if (!deleteCategoryName || deleteCategoryName === 'all') return;
    
    // Show syncing status
    updateSyncStatus('syncing');
    
    // Get default category
    const defaultCategory = categories[0] || 'general';
    
    // Update all notes in this category
    const batch = db.batch();
    
    // Get all notes in this category
    db.collection('users').doc(currentUserId).collection('notes')
      .where('category', '==', deleteCategoryName)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, { category: defaultCategory });
        });
        
        // Remove category from list
        const updatedCategories = categories.filter(cat => cat !== deleteCategoryName);
        
        // Update categories in Firestore
        batch.update(db.collection('users').doc(currentUserId).collection('categories').doc('default'), {
          list: updatedCategories
        });
        
        // Commit batch
        return batch.commit();
      })
      .then(() => {
        // Remove category color
        delete categoryColors[deleteCategoryName];
        saveCategoryColors();
        
        closeConfirmationModal();
        showToast(`Categoria "${capitalizeFirstLetter(deleteCategoryName)}" excluída com sucesso!`);
      })
      .catch((error) => {
        console.error('Error deleting category:', error);
        showToast('Erro ao excluir categoria.', 'error');
        updateSyncStatus('error');
      });
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
    
    // Show syncing status
    updateSyncStatus('syncing');
    
    // Add new category
    const updatedCategories = [...categories, newCategory];
    
    // Update categories in Firestore
    db.collection('users').doc(currentUserId).collection('categories').doc('default')
      .update({
        list: updatedCategories
      })
      .then(() => {
        // Assign a color to the new category
        categoryColors[newCategory] = getRandomColor();
        saveCategoryColors();
        
        newCategoryInput.value = '';
        showToast('Categoria adicionada com sucesso!');
      })
      .catch((error) => {
        console.error('Error adding category:', error);
        showToast('Erro ao adicionar categoria.', 'error');
        updateSyncStatus('error');
      });
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
      
      // Create delete button
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
      notes: notes.map(note => ({
        ...note,
        createdAt: note.createdAt ? note.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: note.updatedAt ? note.updatedAt.toDate().toISOString() : new Date().toISOString()
      })),
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
            // Show syncing status
            updateSyncStatus('syncing');
            
            // Import data to Firestore
            importDataToFirestore(data)
              .then(() => {
                closeConfirmationModal();
                showToast('Dados importados com sucesso!');
              })
              .catch((error) => {
                console.error('Error importing data:', error);
                showToast('Erro ao importar dados.', 'error');
                updateSyncStatus('error');
              });
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
  
  async function importDataToFirestore(data) {
    // Create batch
    const batch = db.batch();
    
    // Delete all existing notes
    const notesSnapshot = await db.collection('users').doc(currentUserId).collection('notes').get();
    notesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Add imported notes
    for (const note of data.notes) {
      const noteRef = db.collection('users').doc(currentUserId).collection('notes').doc();
      batch.set(noteRef, {
        title: note.title,
        category: note.category,
        content: note.content,
        code: note.code || '',
        createdAt: firebase.firestore.Timestamp.fromDate(new Date(note.createdAt)),
        updatedAt: firebase.firestore.Timestamp.fromDate(new Date(note.updatedAt))
      });
    }
    
    // Update categories
    batch.set(db.collection('users').doc(currentUserId).collection('categories').doc('default'), {
      list: data.categories
    });
    
    // Update category colors
    batch.set(db.collection('users').doc(currentUserId).collection('categoryColors').doc('colors'), 
      data.categoryColors || {});
    
    // Commit batch
    return batch.commit();
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
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function escapeHTML(str) {
    if (!str) return '';
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
});
