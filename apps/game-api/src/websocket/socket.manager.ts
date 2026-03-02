import type { Server, Socket } from "socket.io";

export class SocketManager {
    private io!: Server;
    private userSockets = new Map<string, string>(); // userId -> socketId

    setIO(io: Server) {
        this.io = io;
    }

    associateUser(socketId: string, userId: string) {
        this.userSockets.set(userId, socketId);
    }

    disassociateUser(socketId: string) {
        for (const [uid, sid] of this.userSockets.entries()) {
            if (sid === socketId) {
                this.userSockets.delete(uid);
                return;
            }
        }
    }

    emitToUser<T>(userId: string, event: string, payload: T): boolean {
        const socketId = this.userSockets.get(userId);
        if (!socketId) return false;
        this.io.to(socketId).emit(event, payload);
        return true;
    }

    // ── Room helpers ────────────────────────────────────────────────────────
    joinSession(socket: Socket, sessionId: string) {
        socket.join(sessionId);
    }

    leaveSession(socket: Socket, sessionId: string) {
        socket.leave(sessionId);
    }

    // ── Emit to an entire session room ──────────────────────────────────────
    emitToSession<T>(sessionId: string, event: string, payload: T) {
        this.io.to(sessionId).emit(event, payload);
    }

    // ── Emit to a single socket ─────────────────────────────────────────────
    emitToSocket<T>(socket: Socket, event: string, payload: T) {
        socket.emit(event, payload);
    }

    // ── Room membership count ───────────────────────────────────────────────
    async countInSession(sessionId: string): Promise<number> {
        const sockets = await this.io.in(sessionId).fetchSockets();
        return sockets.length;
    }
}
