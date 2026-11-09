package com.jnapanam.sportszone.security;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * Validate deployment security before Spring initializes the DataSource,
 * runs Flyway migrations or opens HTTP listeners. Registered in spring.factories.
 * The application-ready guard is retained as a second defence.
 */
public final class ProductionEnvironmentPostProcessor implements EnvironmentPostProcessor {
    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        new ProductionConfigurationGuard(environment).validate();
    }
}
