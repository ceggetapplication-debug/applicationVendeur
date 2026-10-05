import { Account, Client, Databases, ID, Storage } from "react-native-appwrite";

const client = new Client()
	.setProject("67dcd2f7003c5b3609a7")
	.setPlatform("com.koceiladrk.cegget");


const databases = new Databases(client);

const storage = new Storage(client);

export { client, databases, storage };
