document.addEventListener('DOMContentLoaded', function() {
  // Auth elements
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterLink = document.getElementById('showRegister');
  const showLoginLink = document.getElementById('showLogin');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const logoutBtn = document.getElementById('logoutBtn');
  const userEmail = document.getElementById('userEmail');
  
  // Show register form
  showRegisterLink.addEventListener('click', function(e) {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    registerError.textContent = '';
  });
  
  // Show login form
  showLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    loginError.textContent = '';
  });
  
  // Login
  loginBtn.addEventListener('click', function() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
      loginError.textContent = 'Por favor, preencha todos os campos.';
      return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    loginError.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        // Login successful, UI will update via auth state change
        loginEmail.value = '';
        loginPassword.value = '';
      })
      .catch(error => {
        console.error('Login error:', error);
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'Email ou senha incorretos.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
        }
        
        loginError.textContent = errorMessage;
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Entrar';
      });
  });
  
  // Register
  registerBtn.addEventListener('click', function() {
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;
    
    if (!email || !password || !confirm) {
      registerError.textContent = 'Por favor, preencha todos os campos.';
      return;
    }
    
    if (password !== confirm) {
      registerError.textContent = 'As senhas não coincidem.';
      return;
    }
    
    if (password.length < 6) {
      registerError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }
    
    // Show loading state
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    registerError.textContent = '';
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        // Registration successful, UI will update via auth state change
        registerEmail.value = '';
        registerPassword.value = '';
        confirmPassword.value = '';
        
        // Initialize user data in Firestore
        const user = auth.currentUser;
        db.collection('users').doc(user.uid).set({
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Create default categories for new user
        db.collection('users').doc(user.uid).collection('categories').doc('default').set({
          list: ['commands', 'concepts', 'tutorials', 'tips']
        });
      })
      .catch(error => {
        console.error('Registration error:', error);
        let errorMessage = 'Erro ao registrar. Tente novamente.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Senha muito fraca.';
        }
        
        registerError.textContent = errorMessage;
        registerBtn.disabled = false;
        registerBtn.innerHTML = 'Registrar';
      });
  });
  
  // Logout
  logoutBtn.addEventListener('click', function() {
    auth.signOut()
      .then(() => {
        // Logout successful, UI will update via auth state change
      })
      .catch(error => {
        console.error('Logout error:', error);
        showToast('Erro ao sair. Tente novamente.', 'error');
      });
  });
  
  // Listen for auth state changes
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      authContainer.style.display = 'none';
      appContainer.style.display = 'flex';
      userEmail.textContent = user.email;
      
      // Reset forms
      loginEmail.value = '';
      loginPassword.value = '';
      registerEmail.value = '';
      registerPassword.value = '';
      confirmPassword.value = '';
      loginError.textContent = '';
      registerError.textContent = '';
      
      // Reset buttons
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Entrar';
      registerBtn.disabled = false;
      registerBtn.innerHTML = 'Registrar';
      
      // Initialize app data
      initializeUserData(user.uid);
    } else {
      // User is signed out
      appContainer.style.display = 'none';
      authContainer.style.display = 'flex';
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    }
  });
  
  // Initialize user data
  function initializeUserData(userId) {
    // This function will be called from script.js
    if (window.initializeApp) {
      window.initializeApp(userId);
    }
  }
});
