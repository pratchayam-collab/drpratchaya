export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
}

export interface EmailSender {
  send(mail: OutboundEmail): Promise<void>;
}
