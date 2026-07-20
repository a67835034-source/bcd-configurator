// Two distinct, non-combinable LINE URL mechanisms - see the explanation in
// the conversation this was built from. Public LINE URL schemes cannot both
// auto-target a specific person's chat AND pre-fill their compose box; only
// the Messaging API push (backend/src/modules/notifications) can do that.

// 1) Share picker: opens LINE's forward UI with `text` pre-filled. The user
// still taps a recipient (LINE shows recent chats, so the instructor is
// often one tap away, but it's a manual pick, not a guaranteed target).
export function buildLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

// 2) Direct chat: jumps straight to a specific person/Official Account by
// their LINE ID (the same https://line.me/ti/p/~xxx format as the legacy
// LINE_URL constant), but LINE does not allow prefilling their compose box.
export function buildLineDirectChatUrl(lineId: string): string {
  return lineId.startsWith('http') ? lineId : `https://line.me/ti/p/${lineId}`;
}

export function openLineUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
