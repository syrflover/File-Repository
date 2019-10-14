import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('file')
export default class File {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column('varchar', { unique: true })
    public path!: string; // {HOME}/files/books/12345/0.jpg

    @Column('varchar')
    public content_type!: string; // mime-types

    @CreateDateColumn()
    @Column('timestamptz')
    public created_at!: Date;

    @UpdateDateColumn()
    @Column('timestamptz')
    public updated_at!: Date;
}
