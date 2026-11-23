package br.com.crithit.api.ai;

public class AiTransientException extends RuntimeException {
    public AiTransientException(String message, Throwable cause) {
        super(message, cause);
    }
    public AiTransientException(String message) {
        super(message);
    }
}
