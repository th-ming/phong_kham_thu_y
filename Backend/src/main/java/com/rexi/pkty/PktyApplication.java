package com.rexi.pkty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
@org.springframework.context.annotation.Import({SecurityConfig.class, AppConfig.class})
public class PktyApplication {

	public PktyApplication() {
		System.out.println("DEBUG: PktyApplication INSTANCE CREATED!");
	}

	public static void main(String[] args) {
		System.out.println("DEBUG: PKTY APPLICATION STARTING...");
		SpringApplication.run(PktyApplication.class, args);
	}

}

