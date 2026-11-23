package br.com.crithit.api.security;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ValidHttpUrlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidHttpUrl {
    String message() default "URL must be a valid http:// or https:// address";
    boolean allowNull() default false;
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
