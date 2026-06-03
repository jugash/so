package com.metalstack.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_ReturnsNotFoundResponse() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Resource", "field", "value");
        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(ex);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Resource not found with field: 'value'", response.getBody().get("message"));
    }

    @Test
    void handleDuplicateVote_ReturnsConflictResponse() {
        DuplicateVoteException ex = new DuplicateVoteException("Duplicate vote message");
        ResponseEntity<Map<String, Object>> response = handler.handleDuplicateVote(ex);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Duplicate vote message", response.getBody().get("message"));
    }

    @Test
    void handleBadCredentials_ReturnsUnauthorizedResponse() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials message");
        ResponseEntity<Map<String, Object>> response = handler.handleBadCredentials(ex);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid username or password", response.getBody().get("message"));
    }

    @Test
    void handleBadRequest_ReturnsBadRequestResponse() {
        IllegalArgumentException ex = new IllegalArgumentException("Bad request message");
        ResponseEntity<Map<String, Object>> response = handler.handleBadRequest(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Bad request message", response.getBody().get("message"));
    }

    @Test
    void handleValidation_ReturnsFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field1", "error message");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation failed", response.getBody().get("error"));
        
        Map<?, ?> fieldErrors = (Map<?, ?>) response.getBody().get("fieldErrors");
        assertNotNull(fieldErrors);
        assertEquals("error message", fieldErrors.get("field1"));
    }

    @Test
    void handleGeneral_ReturnsInternalServerErrorResponse() {
        Exception ex = new RuntimeException("Runtime error message");
        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(ex);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("An unexpected error occurred", response.getBody().get("message"));
    }
}
