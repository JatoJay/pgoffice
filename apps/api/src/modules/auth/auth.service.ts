import { Inject, Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { DatabaseService } from "../../db/database.service.js";

export type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  created_at: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(JwtService) private readonly jwt: JwtService
  ) {}

  async register(input: { email: string; password: string; name?: string }) {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const { rows } = await this.db.query<AuthUserRow>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, password_hash, created_at`,
      [input.email, input.name ?? null, passwordHash],
      { isSuperAdmin: true }
    );

    const user = rows[0];
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.signToken(user)
    };
  }

  async login(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.signToken(user)
    };
  }

  async validateUser(payload: JwtPayload) {
    const { rows } = await this.db.query<AuthUserRow>(
      "SELECT id, email, name, password_hash, created_at FROM users WHERE id = $1",
      [payload.sub],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }

  private async findByEmail(email: string) {
    const { rows } = await this.db.query<AuthUserRow>(
      "SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1",
      [email],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }

  private signToken(user: AuthUserRow) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
