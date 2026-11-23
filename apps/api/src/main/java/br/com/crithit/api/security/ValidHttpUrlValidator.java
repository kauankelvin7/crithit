package br.com.crithit.api.security;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidHttpUrlValidator implements ConstraintValidator<ValidHttpUrl, String> {

    private final UrlSecurityValidator urlSecurityValidator = new UrlSecurityValidator();
    private boolean allowNull;

    @Override
    public void initialize(ValidHttpUrl constraintAnnotation) {
        this.allowNull = constraintAnnotation.allowNull();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return allowNull;
        }
        if (allowNull && value.isBlank()) {
            return true;
        }
        return urlSecurityValidator.isValidHttpUrl(value);
    }
}
