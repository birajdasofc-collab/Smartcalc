
export class USBPrinterService {
  private device: USBDevice | null = null;
  private endpointOut: number | null = null;

  constructor(device: USBDevice | null) {
    this.device = device;
    if (device) {
      this.findEndpoint();
    }
  }

  private findEndpoint() {
    if (!this.device || !this.device.configuration) return;
    
    for (const iface of this.device.configuration.interfaces) {
      for (const alternate of iface.alternates) {
        if (alternate.interfaceClass === 7) { // Printer class
          for (const endpoint of alternate.endpoints) {
            if (endpoint.direction === 'out') {
              this.endpointOut = endpoint.endpointNumber;
              return;
            }
          }
        }
      }
    }
    
    // Fallback: try to find any 'out' endpoint
    for (const iface of this.device.configuration.interfaces) {
      for (const alternate of iface.alternates) {
        for (const endpoint of alternate.endpoints) {
          if (endpoint.direction === 'out') {
            this.endpointOut = endpoint.endpointNumber;
            return;
          }
        }
      }
    }
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.device || this.endpointOut === null) {
      throw new Error("Printer not connected or endpoint not found");
    }

    try {
      await this.device.transferOut(this.endpointOut, data);
    } catch (err) {
      console.error("Print error:", err);
      throw err;
    }
  }

  // ESC/POS Commands
  static COMMANDS = {
    INIT: new Uint8Array([0x1B, 0x40]),
    ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
    ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),
    BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
    TEXT_SIZE_NORMAL: new Uint8Array([0x1D, 0x21, 0x00]),
    TEXT_SIZE_LARGE: new Uint8Array([0x1D, 0x21, 0x11]),
    FEED_LINE: new Uint8Array([0x0A]),
    CUT: new Uint8Array([0x1D, 0x56, 0x41, 0x03]),
  };

  static encoder = new TextEncoder();

  static generateReceipt(transaction: any, profile: any): Uint8Array {
    const chunks: Uint8Array[] = [];
    const add = (arr: Uint8Array) => chunks.push(arr);
    const addText = (text: string) => chunks.push(this.encoder.encode(text));
    const addLine = (text: string = "") => {
      addText(text);
      add(this.COMMANDS.FEED_LINE);
    };

    const subtotal = transaction.items?.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) || 
                     (transaction.amount + (transaction.discount || 0) - (transaction.gstAmount || 0));

    add(this.COMMANDS.INIT);
    add(this.COMMANDS.ALIGN_CENTER);
    add(this.COMMANDS.BOLD_ON);
    add(this.COMMANDS.TEXT_SIZE_LARGE);
    addLine(profile.shopName.toUpperCase());
    add(this.COMMANDS.TEXT_SIZE_NORMAL);
    add(this.COMMANDS.BOLD_OFF);
    if (profile.gstNumber) addLine(`GSTIN: ${profile.gstNumber}`);
    addLine(profile.address);
    
    add(this.COMMANDS.ALIGN_LEFT);
    addLine("================================"); // Thick line equivalent
    
    const dateStr = new Date(transaction.date).toLocaleDateString();
    
    addLine("Bill to");
    addLine(`${transaction.customerName || 'Customer'}`);
    addLine(`${transaction.customerMobile || 'N/A'}`);
    addLine(`Date : ${dateStr}`);
    addLine(`Inv number : ${transaction.id.toUpperCase().slice(0, 8)}`);
    
    addLine("--------------------------------");
    addLine("Product          Qty      Amount");
    addLine("--------------------------------");
    
    if (transaction.items) {
      transaction.items.forEach((item: any) => {
        const name = item.name.padEnd(16).slice(0, 16);
        const qty = `x${item.quantity}`.padStart(5);
        const amt = (item.price * item.quantity).toString().padStart(9);
        addLine(`${name}${qty}${amt}`);
      });
    } else {
      addLine(`${(transaction.note || 'Sale').padEnd(16)}    x1    ${transaction.amount.toString().padStart(9)}`);
    }
    
    addLine("--------------------------------");
    add(this.COMMANDS.ALIGN_RIGHT);
    addLine(`Product amount : ${subtotal}`);
    if (transaction.gstAmount) {
      addLine(`GST : ${transaction.gstPercentage}%`);
    }
    if (transaction.discount) {
      const discPercent = ((transaction.discount / (subtotal + (transaction.gstAmount || 0))) * 100).toFixed(1);
      addLine(`Discount : ${discPercent}%`);
    }
    addLine(`Subtotal : ${subtotal + (transaction.gstAmount || 0)}`);
    add(this.COMMANDS.BOLD_ON);
    addLine(`Total amount : ${transaction.amount}`);
    add(this.COMMANDS.BOLD_OFF);
    
    addLine("--------------------------------");
    add(this.COMMANDS.ALIGN_CENTER);
    add(this.COMMANDS.BOLD_ON);
    addLine("Thank you for shopping with us !");
    add(this.COMMANDS.BOLD_OFF);
    addLine("--------------------------------");
    addLine(`Powered by Smart Dukaan`);
    addLine("");
    addLine("");
    addLine("");
    add(this.COMMANDS.CUT);

    // Combine all chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}
