interface BlobEventInit {
    data: Blob;
    blob: Blob; // chromium bug
}

declare class BlobEvent extends Event {
    
    constructor(type: string, eventInitDict: BlobEventInit);
    
    data: Blob;
}

interface BlobEventListener {
    (ev: BlobEvent): void;
}
