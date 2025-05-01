function addCopyButtonToPost(post) {
    // Avoid duplicate buttons
    if (post.querySelector(".copy-linkedin-btn")) return;
  
    // Locate the content of the post
    const contentEl = post.querySelector('[data-testid="feed-shared-update-v2__description"]') ||
                      post.querySelector('span.break-words') ||
                      post.querySelector('.feed-shared-inline-show-more-text') ||
                      post.querySelector('.update-components-text');
  
    if (!contentEl) return;
  
    const button = document.createElement("button");
    button.textContent = "📋 Copy";
    button.className = "copy-linkedin-btn";
    button.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 9999;
      background: #0073b1;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
    `;
  
    button.onclick = () => {
      const text = contentEl.innerText.trim();
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = "✅ Copied!";
        setTimeout(() => (button.textContent = "📋 Copy"), 1500);
      });
    };
  
    post.style.position = "relative"; // Ensure parent is relatively positioned
    post.appendChild(button);
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
            } else {
              // Check for child posts with various selectors
              const posts = [
                ...node.querySelectorAll('div.feed-shared-update-v2'),
                ...node.querySelectorAll('.fie-impression-container'),
                ...node.querySelectorAll('article.feed-shared-update-v2__content').map(el => el.closest('.fie-impression-container') || el)
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
  setTimeout(initializeExtension, 2000);
});