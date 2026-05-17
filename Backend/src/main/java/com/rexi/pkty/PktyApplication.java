package com.rexi.pkty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
@org.springframework.context.annotation.Import({SecurityConfig.class, AppConfig.class})
public class PktyApplication {

	public PktyApplication() {
		System.out.println("DEBUG: PktyApplication INSTANCE CREATED!");
	}

	public static void main(String[] args) {
		System.out.println("DEBUG: PKTY APPLICATION STARTING...");
		
		// NẠP BIẾN MÔI TRƯỜNG TỪ FILE .ENV (BẢO MẬT)
		try {
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> {
				System.setProperty(entry.getKey(), entry.getValue());
			});
			System.out.println("DEBUG: .env file loaded successfully!");
		} catch (Exception e) {
			System.err.println("WARNING: Could not load .env file: " + e.getMessage());
		}

		SpringApplication.run(PktyApplication.class, args);
	}

}
