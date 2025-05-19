/**
 * Svelte action to make an element draggable by its handle.
 *
 * Usage:
 * <div use:draggable={{ handle: '.panel-header' }}>...</div>
 *
 * The element with the action applied will be the one that moves.
 * The `handle` option specifies a CSS selector for the element within the draggable element
 * that should initiate the drag (e.g., a header bar).
 */
export function draggable(node: HTMLElement, options?: { handle?: string }) {
    let dragging = false;
    let offsetX: number;
    let offsetY: number;

    const handleElement = options?.handle ? node.querySelector(options.handle) as HTMLElement : node;

    if (!handleElement) {
        console.warn(`Draggable handle element not found with selector: ${options?.handle}`);
        // Fallback to dragging the node itself if handle not found or specified
        // handleElement = node; // Or simply return if handle is mandatory
        return; // Exit if handle is required but not found
    }

    handleElement.style.cursor = 'move';
    // Add accessibility attributes to the handle
    handleElement.setAttribute('role', 'button');
    handleElement.setAttribute('tabindex', '0');
    handleElement.setAttribute('aria-label', 'Drag to move'); // Generic label, can be customized

    function handleMouseDown(event: MouseEvent) {
        // Prevent dragging if clicking on interactive elements within the handle (like buttons)
        if (event.target !== handleElement && (event.target as HTMLElement).closest('button, input, select, textarea')) {
            return;
        }

        dragging = true;
        offsetX = event.clientX - node.offsetLeft;
        offsetY = event.clientY - node.offsetTop;
        handleElement.style.cursor = 'grabbing';
        handleElement.setAttribute('aria-grabbed', 'true');

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!dragging) return;
        event.preventDefault(); // Prevent text selection during drag

        const newX = event.clientX - offsetX;
        const newY = event.clientY - offsetY;

        // Optional: Basic boundary checks (constrain within viewport or parent)
        const parentRect = node.parentElement?.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const constrainedX = Math.max(0, Math.min(newX, (parentRect?.width || window.innerWidth) - nodeRect.width));
        const constrainedY = Math.max(0, Math.min(newY, (parentRect?.height || window.innerHeight) - nodeRect.height));

        node.style.left = `${constrainedX}px`;
        node.style.top = `${constrainedY}px`;
        node.style.right = 'auto'; // Ensure left/top positioning takes precedence
        node.style.bottom = 'auto';
    }

    function handleMouseUp() {
        if (dragging) {
            dragging = false;
            handleElement.style.cursor = 'move';
            handleElement.setAttribute('aria-grabbed', 'false');
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }

    handleElement.addEventListener('mousedown', handleMouseDown);

    return {
        destroy() {
            handleElement.removeEventListener('mousedown', handleMouseDown);
            // Clean up window listeners if the component is destroyed while dragging
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    };
}