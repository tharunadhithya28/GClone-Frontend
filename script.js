document.addEventListener('DOMContentLoaded', function() {
    const addNoteButton = document.getElementById('addNoteButton');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteTags = document.getElementById('noteTags');
    const notesContainer = document.getElementById('notesContainer');

    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const logoutButton = document.getElementById('logoutButton');
    const authContainer = document.getElementById('authContainer');
    const noteInputContainer = document.getElementById('noteInputContainer');

    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close');
    const authForm = document.getElementById('authForm');
    const authName = document.getElementById('authName');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');

    let authMode = 'login';
    let token = localStorage.getItem('token');
    console.log(token);

    const fetchNotes = async () => {
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/notes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const notes = await response.json();
        renderNotes(notes);
    };

    const renderNotes = (notes) => {
        notesContainer.innerHTML = '';
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            
            const noteContent = document.createElement('p');
            noteContent.textContent = `${note.title}: ${note.content}`;
            noteElement.appendChild(noteContent);

            const tagsContent = document.createElement('p');
            tagsContent.textContent = `Tags: ${note.tags.join(', ')}`;
            noteElement.appendChild(tagsContent);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteNote(note._id));

            const archiveButton = document.createElement('button');
            archiveButton.textContent = note.isArchived ? 'Unarchive' : 'Archive';
            archiveButton.addEventListener('click', () => archiveNote(note._id));

            noteElement.appendChild(deleteButton);
            noteElement.appendChild(archiveButton);
            notesContainer.appendChild(noteElement);
        });
    };

    const addNote = async () => {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        const tags = noteTags.value.split(',').map(tag => tag.trim());

        if (!title || !content) {
            alert('Please enter a title and content.');
            return;
        }

        const response = await fetch('http://localhost:5000/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, tags })
        });

        if (response.ok) {
            const note = await response.json();
            fetchNotes()
            renderNotes([note, ...notesContainer]);
            noteTitle.value = '';
            noteContent.value = '';
            noteTags.value = '';
        } else {
            const error =             await response.json();
            alert(error.message);
        }
    };

    const deleteNote = async (noteId) => {
        const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchNotes();
        } else {
            const error = await response.json();
            alert(error.message);
        }
    };

    const getArchivedNotes = async(noteId) => {
        const response = await fetch(`http://localhost:5000/api/notes/archived`,{
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok){
            const notes = await response.json();
            renderNotes(notes)
        }else{
            const error = await response.json();
            alert(error.message);
        }
    }

    const archiveNote = async (noteId) => {
        const response = await fetch(`http://localhost:5000/api/notes/${noteId}/archive`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchNotes();
        } else {
            const error = await response.json();
            alert(error.message);
        }
    };

    const authenticateUser = async (mode) => {
        const name = authName.value.trim();
        console.log(name);
        const email = authEmail.value.trim();
        console.log(email);
        const password = authPassword.value.trim();
        console.log(password);

        if (!email || !password || (mode === 'register' && !name)) {
            alert('Please fill in all fields.');
            return;
        }

        const response = await fetch(`http://localhost:5000/api/users${mode === 'login' ? '/login' : ''}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            modal.style.display = 'none';
            authForm.reset();
            authName.style.display = mode === 'register' ? 'none' : 'block';
            toggleAuthButtons(true);
            fetchNotes();
        } else {
            const error = await response.json();
            alert(error.message);
        }
    };

    const toggleAuthButtons = (isAuthenticated) => {
        if (isAuthenticated) {
            loginButton.style.display = 'none';
            registerButton.style.display = 'none';
            logoutButton.style.display = 'block';
            noteInputContainer.style.display = 'block';
        } else {
            loginButton.style.display = 'block';
            registerButton.style.display = 'block';
            logoutButton.style.display = 'none';
            noteInputContainer.style.display = 'none';
            notesContainer.innerHTML = '';
        }
    };

    addNoteButton.addEventListener('click', addNote);

    archiveButton.addEventListener('click', () => {
        getArchivedNotes()
    })

    loginButton.addEventListener('click', () => {
        authMode = 'login';
        authName.style.display = 'none';
        modal.style.display = 'block';
    });

    registerButton.addEventListener('click', () => {
        authMode = 'register';
        authName.style.display = 'block';
        modal.style.display = 'block';
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        token = null;
        toggleAuthButtons(false);
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    authForm.addEventListener('submit', (event) => {
        event.preventDefault();
        authenticateUser(authMode);
    });

    if (token) {
        toggleAuthButtons(true);
        fetchNotes();
    }
});

