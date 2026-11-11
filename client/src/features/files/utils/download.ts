export function triggerBrowserDownload(url: string): void {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.src = url;
    document.body.appendChild(frame);

    window.setTimeout(() => frame.remove(), 5 * 60 * 1000);
}
