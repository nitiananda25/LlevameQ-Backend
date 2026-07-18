import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  carModel: string;
}