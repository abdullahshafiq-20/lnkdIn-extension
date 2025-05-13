// Global user state
let currentUser = null;

// Function to create and show a modal for secret input
function showSecretInputModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'linkedin-extension-auth-modal';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 100%;
    `;

    // Create modal header
    const modalHeader = document.createElement('h3');
    modalHeader.textContent = 'Authentication Required';
    modalHeader.style.cssText = `
        margin-top: 0;
        color: #0a66c2;
    `;

    // Create input field
    const inputField = document.createElement('input');
    inputField.type = 'password';
    inputField.placeholder = 'Enter your secret key';
    inputField.style.cssText = `
        width: 100%;
        padding: 8px;
        margin: 10px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    `;

    // Create status message
    const statusMessage = document.createElement('div');
    statusMessage.style.cssText = `
        margin: 10px 0;
        color: #d93025;
        font-size: 14px;
        min-height: 20px;
    `;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    `;

    // Create validate button
    const validateButton = document.createElement('button');
    validateButton.textContent = 'Validate';
    validateButton.style.cssText = `
        background-color: #0a66c2;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
    `;

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ccc;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
    `;

    // Add click event for validate button
    validateButton.onclick = () => {
        const secret = inputField.value.trim();
        
        if (!secret) {
            statusMessage.textContent = 'Please enter a secret key';
            return;
        }

        validateButton.textContent = 'Validating...';
        validateButton.disabled = true;
        
        validateSecret(secret)
            .then(user => {
                if (user) {
                    modalContainer.remove();
                    // Save user to localStorage for persistence
                    localStorage.setItem('linkedInExtensionUser', JSON.stringify(user));
                    currentUser = user;
                } else {
                    statusMessage.textContent = 'Invalid secret key';
                    validateButton.textContent = 'Validate';
                    validateButton.disabled = false;
                }
            })
            .catch(error => {
                statusMessage.textContent = 'Error validating secret: ' + error.message;
                validateButton.textContent = 'Validate';
                validateButton.disabled = false;
            });
    };

    // Add click event for cancel button
    cancelButton.onclick = () => {
        modalContainer.remove();
    };

    // Allow Enter key to submit
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateButton.click();
        }
    });

    // Assemble modal
    buttonContainer.appendChild(validateButton);
    buttonContainer.appendChild(cancelButton);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(inputField);
    modalContent.appendChild(statusMessage);
    modalContent.appendChild(buttonContainer);
    
    modalContainer.appendChild(modalContent);
    
    document.body.appendChild(modalContainer);
    
    // Focus the input field
    inputField.focus();
}

// Function to validate secret with backend
function validateSecret(secret) {
    return fetch('http://localhost:3000/api/validateSecret', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid secret or server error');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.user && data.user.email) {
            return data.user;
        } else {
            throw new Error(data.message || 'Authentication failed');
        }
    });
}

// Check if user is authenticated
function checkAuthentication() {
    // Try to get user from localStorage
    const savedUser = localStorage.getItem('linkedInExtensionUser');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            return Promise.resolve(true);
        } catch (e) {
            localStorage.removeItem('linkedInExtensionUser');
        }
    }
    
    return new Promise((resolve) => {
        showSecretInputModal();
        
        // Check periodically if user is authenticated
        const checkInterval = setInterval(() => {
            if (currentUser) {
                clearInterval(checkInterval);
                resolve(true);
            }
        }, 1000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
        }, 120000);
    });
}

function addCopyButtonToPost(post) {
    // Avoid duplicate buttons
    if (post.querySelector(".copy-linkedin-btn")) return;
  
    // Locate the content of the post
    const contentEl = post.querySelector('[data-testid="feed-shared-update-v2__description"]') ||
                      post.querySelector('span.break-words') ||
                      post.querySelector('.feed-shared-inline-show-more-text') ||
                      post.querySelector('.update-components-text');
  
    if (!contentEl) return;
  
    // Create container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "linkedin-extension-buttons";
    buttonContainer.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 9999;
      display: flex;
      gap: 5px;
    `;
  
    // Copy Button
    const copyButton = document.createElement("button");
    copyButton.textContent = "📋 Copy";
    copyButton.className = "copy-linkedin-btn";
    copyButton.style.cssText = `
      background: #0073b1;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
    `;
  
    copyButton.onclick = () => {
      const text = contentEl.innerText.trim();
      navigator.clipboard.writeText(text).then(() => {
        copyButton.textContent = "✅ Copied!";
        setTimeout(() => (copyButton.textContent = "📋 Copy"), 1500);
      });
    };
  
    // Save Button
    const saveButton = document.createElement("button");
    saveButton.textContent = "💾 Save";
    saveButton.className = "save-linkedin-btn";
    saveButton.style.cssText = `
      background: #0a66c2;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
    `;
  
    saveButton.onclick = () => {
      const text = contentEl.innerText.trim();
      
      if (!currentUser) {
        checkAuthentication().then(isAuthenticated => {
          if (isAuthenticated) {
            savePostToBackend(text, saveButton);
          } else {
            alert("Authentication required to save posts.");
          }
        });
      } else {
        savePostToBackend(text, saveButton);
      }
    };
  
    // Add buttons to container
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(saveButton);
  
    post.style.position = "relative"; // Ensure parent is relatively positioned
    post.appendChild(buttonContainer);
}

// Function to save post content to backend
function savePostToBackend(content, buttonElement) {
    buttonElement.textContent = "⏳ Saving...";
    
    if (!currentUser || !currentUser.email) {
        buttonElement.textContent = "⚠️ Auth Error";
        setTimeout(() => (buttonElement.textContent = "💾 Save"), 1500);
        console.error('User not authenticated');
        return;
    }
    
    fetch('http://localhost:3000/api/extension/savePost', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            content,
            email: currentUser.email 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        buttonElement.textContent = "✅ Saved!";
        setTimeout(() => (buttonElement.textContent = "💾 Save"), 1500);
        console.log('Post saved successfully:', data);
    })
    .catch(error => {
        buttonElement.textContent = "❌ Failed";
        setTimeout(() => (buttonElement.textContent = "💾 Save"), 1500);
        console.error('Error saving post:', error);
    });
}

function observeFeed() {
    // Try different possible feed container selectors
    const feedContainer = document.querySelector('[role="main"]') || 
                         document.querySelector('.scaffold-finite-scroll__content');
  
    if (!feedContainer) return;
  
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Check for various post types
            if (node.matches('div.feed-shared-update-v2') || 
                node.matches('.fie-impression-container') ||
                node.classList.contains('feed-shared-update-v2')) {
              addCopyButtonToPost(node);
            } else {              // Check for child posts with various selectors
              const posts = [
                ...node.querySelectorAll('div.feed-shared-update-v2'),
                ...node.querySelectorAll('.fie-impression-container'),
                ...Array.from(node.querySelectorAll('article.feed-shared-update-v2__content')).map(el => el.closest('.fie-impression-container') || el)
              ];
              posts.forEach(addCopyButtonToPost);
            }
          }
        });
        
        // Also check modified nodes for posts that might have been updated
        document.querySelectorAll('.fie-impression-container').forEach(post => {
          if (!post.querySelector('.copy-linkedin-btn')) {
            addCopyButtonToPost(post);
          }
        });
      });
    });
  
    observer.observe(feedContainer, {
      childList: true,
      subtree: true
    });
  
    // Also apply to existing posts on initial load
    const initialPosts = [
      ...document.querySelectorAll('div.feed-shared-update-v2'),
      ...document.querySelectorAll('.fie-impression-container')
    ];
    initialPosts.forEach(addCopyButtonToPost);
}
  
function initializeExtension() {
  // Try to load saved user from localStorage first
  const savedUser = localStorage.getItem('linkedInExtensionUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      console.log('User authenticated:', currentUser.email);
    } catch (e) {
      console.error('Error parsing saved user:', e);
      localStorage.removeItem('linkedInExtensionUser');
    }
  }
  
  observeFeed();
  
  // Check every 3 seconds to handle page navigation in the SPA
  setInterval(() => {
    const posts = [
      ...document.querySelectorAll('div.feed-shared-update-v2'),
      ...document.querySelectorAll('.fie-impression-container')
    ];
    posts.forEach(post => {
      if (!post.querySelector('.copy-linkedin-btn')) {
        addCopyButtonToPost(post);
      }
    });
  }, 3000);
}

// Run after a short delay to ensure the page is loaded
window.addEventListener("load", () => {
  setTimeout(() => {
    checkAuthentication().then(isAuthenticated => {
      if (isAuthenticated) {
        initializeExtension();
      } else {
        alert("Authentication required to use the extension.");
      }
    });
  }, 2000);
});