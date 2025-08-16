import app from 'flarum/forum/app';
// Importing types can improve intellisense, though often not strictly necessary for basic extensions
// import DiscussionPage from 'flarum/forum/components/DiscussionPage';
// import Composer from 'flarum/forum/components/Composer';

// --- Define types for our variables ---
// While not strictly necessary for simple DOM elements, it's good practice
let counterElement: HTMLDivElement | null = null;
let textareaElement: HTMLTextAreaElement | null = null;
let lastCount: number = -1; // Initialize to -1 to force first update
let observer: MutationObserver | null = null; // Store observer instance

// --- Function to update the character count display ---
function updateCounter(): void {
  if (!counterElement || !textareaElement) return;

  const currentText: string = textareaElement.value || '';
  const currentCount: number = currentText.length;

  // Only update the DOM if the count actually changed
  if (currentCount !== lastCount) {
      counterElement.textContent = `${currentCount} characters`;
      lastCount = currentCount;
      console.log(`Character count updated: ${currentCount}`); // Optional: less verbose logging
  }
}

// --- Function to add the counter element ---
// --- Function to add the counter element ---
function addCounter(): void {
  // Prevent adding multiple counters if one already exists and is attached
  if (counterElement && document.contains(counterElement)) {
    return;
  }

  // --- Find the textarea within the composer (still needed for counting) ---
  textareaElement = document.querySelector('.ComposerBody-content .TextEditor textarea') ||
                    document.querySelector('.ComposerBody-content textarea') ||
                    document.querySelector('.Composer textarea');

  if (!textareaElement) {
      console.log("Textarea for reply not found. Composer might still be initializing.");
      return;
  }
  console.log("Textarea found:", textareaElement);

  // --- NEW: Find the Composer Header to attach the counter to ---
  // Target the header element specifically
  const composerHeader: Element | null = document.querySelector('.ComposerBody-header');

  if (!composerHeader) {
      console.error("Could not find the ComposerBody-header element.");
      // Fallback: Try attaching to the main composer body if header not found?
      // const fallbackContainer = document.querySelector('.ComposerBody') || document.querySelector('.Composer');
      // if (!fallbackContainer) {
      //    console.error("Fallback container not found either.");
      //    return;
      // }
      // composerHeader = fallbackContainer; // Use fallback, but styling might differ
      return; // Strictly require the header for now
  }

  // --- Create the counter element ---
  counterElement = document.createElement('div');
  // Assign the CSS class defined in forum.less
  counterElement.className = 'character-counter-topright';
  // Set initial count
  const initialText: string = textareaElement.value || '';
  counterElement.textContent = `${initialText.length} characters`;

  // --- Append the counter to the Composer Header ---
  // Appending to the end of the header should integrate it naturally.
  // If the header has specific layout (like flex), the CSS (margin-left: auto)
  // will push it to the right.
  composerHeader.appendChild(counterElement);
  console.log("Character counter element added to ComposerBody-header.");

  // --- Attach event listeners to the textarea for real-time updates ---
  textareaElement.addEventListener('input', updateCounter);
  textareaElement.addEventListener('compositionend', updateCounter);

  // --- Initial update ---
  updateCounter();
}

// --- Function to remove the counter element and listeners ---
function removeCounter(): void {
  // Remove the counter element from the DOM
  if (counterElement && counterElement.parentNode) {
      counterElement.parentNode.removeChild(counterElement);
      console.log("Character counter element removed.");
  }

  // Remove event listeners from the textarea to prevent memory leaks
  if (textareaElement) {
      textareaElement.removeEventListener('input', updateCounter);
      textareaElement.removeEventListener('compositionend', updateCounter);
      console.log("Event listeners removed from textarea.");
  }

  // Reset variables to null
  counterElement = null;
  textareaElement = null;
  lastCount = -1;
}

// --- Main Initializer ---
app.initializers.add('your-vendor-character-counter-topright', () => {
  // --- Observe DOM for Composer Appearance/Disappearance ---
  observer = new MutationObserver((_: MutationRecord[]) => {
    // --- Refined Logic ---
    const composerSelector = '.ComposerBody-content .TextEditor, .ComposerBody-content, .Composer';
    const isComposerPresent = document.querySelector(composerSelector) !== null;
    const isCounterAttached = counterElement && document.contains(counterElement);

    if (isComposerPresent && !isCounterAttached) {
        // Scenario 1: Composer is present, but counter is not set up -> Add it
        setTimeout(() => {
             if ((document.querySelector(composerSelector) !== null) && (!counterElement || !document.contains(counterElement))) {
                 addCounter();
             }
        }, 50);
    } else if (!isComposerPresent && isCounterAttached) {
        // Scenario 2: Composer is gone, but counter is still present -> Remove it
        removeCounter();
    }
    // Scenario 3 & 4: Do nothing
  });

  // --- Start observing ---
  if (observer) { // Check if observer was created
     observer.observe(document.body, {
        childList: true,
        subtree: true
     });
  }

  // --- Optional: Cleanup function (if Flarum provides a hook in the future) ---
  // For now, rely on observer and removeCounter logic.
  // A potential future-proofing idea if Flarum adds extension unload hooks:
  // app.extensionUnloadHooks.push(() => {
  //    if (observer) {
  //       observer.disconnect();
  //       observer = null;
  //    }
  //    removeCounter(); // Ensure cleanup on unload/disable
  // });

});
