'use client'; 

import styles from "./page.module.css";
import LoginPage from "./(auth)/login/page"; 

export default function Home() {
  return (
    <div>
      <main>
        <LoginPage />
      </main>
    </div>
  );
}