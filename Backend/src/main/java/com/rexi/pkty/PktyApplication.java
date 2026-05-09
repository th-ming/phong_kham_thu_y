package com.rexi.pkty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@org.springframework.context.annotation.ComponentScan("com.rexi.pkty")
public class PktyApplication {

	public static void main(String[] args) {
		SpringApplication.run(PktyApplication.class, args);
	}

}

