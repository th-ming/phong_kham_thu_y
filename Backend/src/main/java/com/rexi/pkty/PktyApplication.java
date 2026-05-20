package com.rexi.pkty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.logging.Logger;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
@org.springframework.context.annotation.Import({SecurityConfig.class, AppConfig.class})
public class PktyApplication {

	private static final Logger logger = Logger.getLogger(PktyApplication.class.getName());

	public PktyApplication() {
		logger.info("PktyApplication INSTANCE CREATED!");
	}

	public static void main(String[] args) {
		logger.info("PKTY APPLICATION STARTING...");
		
		// NẠP BIẾN MÔI TRƯỜNG TỪ FILE .ENV (BẢO MẬT)
		try {
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> {
				System.setProperty(entry.getKey(), entry.getValue());
			});
			logger.info(".env file loaded successfully!");
		} catch (Exception e) {
			logger.warning("Could not load .env file: " + e.getMessage());
		}

		SpringApplication.run(PktyApplication.class, args);
	}

}
