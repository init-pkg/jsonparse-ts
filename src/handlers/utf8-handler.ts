import { alloc } from "@/utils/utils";

export class UTF8Handler {
    /** Remaining bytes for a multi-byte UTF-8 character, number of bytes remaining in multi byte utf8 char to read after split boundary */
    protected bytes_remaining: number = 0;

    /** Total bytes in the current UTF-8 character sequence, bytes in multi byte utf8 char to read */
    protected bytes_in_sequence: number = 0;

    /** Temporary buffers for rebuilding chars split before boundary is reached */
    protected temp_buffs: Record<number, Uint8Array>;

    constructor() {
        // Initialize temp buffers for multi-byte characters
        this.temp_buffs = {
            2: alloc(2),
            3: alloc(3),
            4: alloc(4),
        };
    }

    /** Get the remaining bytes for a multi-byte character */
    public getBytesRemaining(): number {
        return this.bytes_remaining;
    }

    public getRemainingBytesInBuff(buffer: Uint8Array): Uint8Array {
        for (let i = 0; i < this.bytes_remaining; i++) {
            this.temp_buffs[this.bytes_in_sequence][this.bytes_in_sequence - this.bytes_remaining + i] = buffer[i];
        }

        const remainingBytes = this.temp_buffs[this.bytes_in_sequence] || alloc(0);
        this.bytes_in_sequence = this.bytes_remaining = 0;

        return remainingBytes;
    }

    public handleBoundarySplit(i: number, buffer: Uint8Array) {
        for (let j = 0; j <= (buffer.length - 1 - i); j++) {
            this.temp_buffs[this.bytes_in_sequence][j] = buffer[i + j];
        }

        this.bytes_remaining = (i + this.bytes_in_sequence) - buffer.length;
    }

    /** Set the remaining bytes, ensuring it's not negative */
    public setBytesRemaining(value: number): void {
        if (value < 0) throw new Error("bytes_remaining cannot be negative");
        this.bytes_remaining = value;
    }

    /** Get the total bytes in the current UTF-8 character sequence */
    public getBytesInSequence(): number {
        return this.bytes_in_sequence;
    }

    /** Set the total bytes, ensuring it's not negative */
    public setBytesInSequence(value: number): void {
        if (value < 0) throw new Error("bytes_in_sequence cannot be negative");
        this.bytes_in_sequence = value;
    }

    /** Get the temporary buffers for multi-byte characters */
    public getTempBuffs(): Record<string, Uint8Array> {
        return this.temp_buffs;
    }

    /** Set the temporary buffers */
    public setTempBuffs(buffers: Record<string, Uint8Array>): void {
        this.temp_buffs = buffers;
    }

    public hasBytesRemaining() {
        return this.bytes_remaining > 0
    }
}
